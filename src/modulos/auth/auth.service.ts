import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Usuario, Sessao, Desafio } from '../../database/entities';
import { VerificarCodigoDto, RedefinirSenhaDto } from './auth.dto';

export function hashSenha(senha: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(senha, salt, 64).toString('hex')}`;
}
function confereSenha(senha: string, hash: string) {
  const [salt, key] = hash.split(':');
  const atual = scryptSync(senha, salt, 64);
  const esperado = Buffer.from(key, 'hex');
  return (
    atual.length === esperado.length &&
    timingSafeEqual(Uint8Array.from(atual), Uint8Array.from(esperado))
  );
}
@Injectable()
export class AuthService {
  private dummyHash = hashSenha(randomBytes(24).toString('hex'));
  constructor(
    private db: DataSource,
    private jwt: JwtService,
  ) {}
  hash(value: string) {
    return createHmac('sha256', process.env.JWT_SECRET)
      .update(value)
      .digest('hex');
  }
  usuarioPublico(u: Usuario) {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      tel: u.tel,
      isAdmin: u.isAdmin,
    };
  }
  async login(email: string, senha: string) {
    const u = await this.db
      .getRepository(Usuario)
      .createQueryBuilder('u')
      .addSelect('u.senhaHash')
      .where('u.email=:email', { email: email.toLowerCase().trim() })
      .getOne();
    const ok = confereSenha(senha, u?.senhaHash ?? this.dummyHash);
    if (!u || !u.ativo || !ok)
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    return this.db.transaction((m) => this.criarSessao(m, u));
  }
  async criarSessao(m: EntityManager, u: Usuario, id: string = randomUUID()) {
    const refreshToken = randomBytes(48).toString('hex');
    await m.save(Sessao, {
      id,
      usuarioId: u.id,
      refreshHash: this.hash(refreshToken),
      expiraEm: new Date(Date.now() + 30 * 86400000),
      revogadaEm: null,
    });
    const token = await this.jwt.signAsync(
      { sub: u.id, sid: id },
      {
        expiresIn: '15m',
        issuer: 'assados-zanini',
        audience: 'assados-zanini-app',
      },
    );
    return {
      token,
      refreshToken,
      expiresIn: 900,
      user: this.usuarioPublico(u),
    };
  }
  async refresh(refreshToken: string) {
    return this.db.transaction(async (m) => {
      const s = await m
        .getRepository(Sessao)
        .createQueryBuilder('s')
        .where('s.refreshHash=:h', { h: this.hash(refreshToken) })
        .setLock('pessimistic_write')
        .getOne();
      if (!s || s.revogadaEm || s.expiraEm <= new Date())
        throw new UnauthorizedException('Sessão expirada.');
      const u = await m.findOneBy(Usuario, { id: s.usuarioId, ativo: true });
      if (!u) throw new UnauthorizedException();
      return this.criarSessao(m, u, s.id);
    });
  }
  async sair(sid: string) {
    await this.db.getRepository(Sessao).update(sid, { revogadaEm: new Date() });
    return { message: 'Sessão encerrada.' };
  }
  async solicitar(tel: string) {
    if (
      process.env.AUTH_DELIVERY_MODE !== 'development' &&
      !process.env.WHATSAPP_GATEWAY_URL
    )
      throw new ServiceUnavailableException(
        'Acesso por WhatsApp ainda não configurado.',
      );
    const recente = await this.db.getRepository(Desafio).findOne({
      where: { destino: tel, finalidade: 'otp' },
      order: { created_at: 'DESC' },
    });
    if (recente && recente.created_at.getTime() > Date.now() - 60000)
      throw new HttpException(
        'Aguarde um minuto para solicitar outro código.',
        429,
      );
    const id = randomUUID(),
      code = String(randomInt(100000, 1000000));
    await this.db.transaction(async (m) => {
      await m.update(
        Desafio,
        { destino: tel, finalidade: 'otp' },
        { consumidoEm: new Date() },
      );
      await m.save(Desafio, {
        id,
        destino: tel,
        finalidade: 'otp',
        segredoHash: this.hash(`${id}:${tel}:${code}`),
        expiraEm: new Date(Date.now() + 300000),
      });
    });
    try {
      if (process.env.AUTH_DELIVERY_MODE !== 'development') {
        const response = await fetch(process.env.WHATSAPP_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WHATSAPP_GATEWAY_TOKEN}`,
          },
          body: JSON.stringify({
            numero: tel + '@c.us',
            mensagem: `Seu código de acesso ao Assados Zanini é ${code}. Válido por 5 minutos.`,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error('delivery');
      }
    } catch {
      await this.db
        .getRepository(Desafio)
        .update(id, { consumidoEm: new Date() });
      throw new ServiceUnavailableException(
        'Não foi possível enviar o código.',
      );
    }
    return {
      desafioId: id,
      message:
        process.env.AUTH_DELIVERY_MODE === 'development'
          ? 'Código de desenvolvimento gerado; nenhum WhatsApp foi enviado.'
          : 'Código enviado por WhatsApp.',
      ...(process.env.AUTH_DELIVERY_MODE === 'development'
        ? { developmentCode: code }
        : {}),
    };
  }
  async verificar(dto: VerificarCodigoDto) {
    const result = await this.db.transaction(async (m) => {
      const d = await m
        .getRepository(Desafio)
        .createQueryBuilder('d')
        .where('d.id=:id', { id: dto.desafioId })
        .setLock('pessimistic_write')
        .getOne();
      if (
        !d ||
        d.finalidade !== 'otp' ||
        d.destino !== dto.tel ||
        d.consumidoEm ||
        d.expiraEm <= new Date() ||
        d.tentativas >= 5
      )
        return null;
      d.tentativas++;
      if (d.segredoHash !== this.hash(`${d.id}:${dto.tel}:${dto.code}`)) {
        await m.save(d);
        return null;
      }
      d.consumidoEm = new Date();
      await m.save(d);
      let u = await m.findOneBy(Usuario, { tel: dto.tel });
      if (!u)
        u = await m.save(
          Usuario,
          m.create(Usuario, { tel: dto.tel, nome: 'Cliente' }),
        );
      if (!u.ativo) return null;
      return this.criarSessao(m, u);
    });
    if (!result)
      throw new UnauthorizedException(
        'Código inválido, expirado ou já utilizado.',
      );
    return result;
  }
  async esqueci(email: string) {
    if (
      process.env.AUTH_DELIVERY_MODE !== 'development' &&
      !process.env.SMTP_HOST
    )
      throw new ServiceUnavailableException(
        'Recuperação de senha ainda não configurada.',
      );
    const u = await this.db
      .getRepository(Usuario)
      .findOneBy({ email: email.toLowerCase(), ativo: true });
    const result: any = {
      message: 'Se o e-mail estiver cadastrado, você receberá as instruções.',
    };
    if (!u) return result;
    const id = randomUUID(),
      token = randomBytes(48).toString('hex');
    await this.db.getRepository(Desafio).save({
      id,
      destino: u.email,
      finalidade: 'senha',
      segredoHash: this.hash(token),
      expiraEm: new Date(Date.now() + 900000),
    });
    if (process.env.AUTH_DELIVERY_MODE === 'development')
      return { ...result, desafioId: id, developmentToken: token };
    const mail = await import('nodemailer');
    try {
      await mail
        .createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        })
        .sendMail({
          from: process.env.SMTP_FROM,
          to: u.email,
          subject: 'Redefina sua senha',
          text: `Acesse ${process.env.FRONTEND_URL}/signin/redefinir?desafioId=${id}&token=${token}`,
        });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail.',
      );
    }
    return result;
  }
  async redefinir(dto: RedefinirSenhaDto) {
    return this.db.transaction(async (m) => {
      const d = await m
        .getRepository(Desafio)
        .createQueryBuilder('d')
        .where('d.id=:id', { id: dto.desafioId })
        .setLock('pessimistic_write')
        .getOne();
      if (
        !d ||
        d.finalidade !== 'senha' ||
        d.consumidoEm ||
        d.expiraEm <= new Date() ||
        d.segredoHash !== this.hash(dto.token)
      )
        throw new BadRequestException('Link inválido ou expirado.');
      const u = await m.findOneBy(Usuario, { email: d.destino, ativo: true });
      if (!u) throw new BadRequestException('Link inválido.');
      await m.update(Usuario, u.id, { senhaHash: hashSenha(dto.senha) });
      await m.update(Sessao, { usuarioId: u.id }, { revogadaEm: new Date() });
      await m.update(
        Desafio,
        { destino: d.destino, finalidade: 'senha' },
        { consumidoEm: new Date() },
      );
      return { message: 'Senha atualizada. Entre novamente.' };
    });
  }
  async google(idToken: string) {
    if (!process.env.GOOGLE_CLIENT_ID)
      throw new ServiceUnavailableException('Login Google não configurado.');
    let payload: any;
    try {
      payload = (
        await new OAuth2Client().verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        })
      ).getPayload();
    } catch {
      throw new UnauthorizedException('Identidade Google inválida.');
    }
    if (!payload?.email_verified)
      throw new UnauthorizedException('E-mail Google não verificado.');
    return this.db.transaction(async (m) => {
      let u = await m.findOneBy(Usuario, { googleId: payload.sub });
      if (!u) {
        u = await m.findOneBy(Usuario, { email: payload.email });
        if (u && !u.googleId)
          throw new BadRequestException(
            'Entre pelo método já cadastrado para vincular sua conta.',
          );
      }
      if (!u)
        u = await m.save(
          Usuario,
          m.create(Usuario, {
            googleId: payload.sub,
            email: payload.email,
            nome: payload.name ?? 'Cliente',
          }),
        );
      if (!u.ativo) throw new UnauthorizedException();
      return this.criarSessao(m, u);
    });
  }
}

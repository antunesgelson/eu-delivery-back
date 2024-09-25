import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from 'typeorm';
import { CategoriaEntity } from '../categoria/categorias.entity';
import { IngredientesEntity } from '../ingrediente/ingredientes.entity';
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from './dto/produto.dto';
import { ProdutosIngredientesEntity } from "./produtoIngrediente.entity";
import { ProdutoEntity } from "./produtos.entity";
import { S3Service } from "../s3/s3.service";
import { AddFotoProdutoDTO } from "./dto/AddFotoProduto.dto";
import { AddAdicionalProdutoDTO } from "./dto/addAdicionalProduto.dto";
import { DeletarAdicionalProdutoDTO } from "./dto/deletarAdicionalProduto.dto";



@Injectable()
export class ProdutoService {
    constructor(
        @InjectRepository(ProdutoEntity)
        private produtoRepository: Repository<ProdutoEntity>,
        @InjectRepository(CategoriaEntity)
        private categoriaRepository: Repository<CategoriaEntity>,
        @InjectRepository(ProdutosIngredientesEntity)
        private produtoIngredienteRepository: Repository<ProdutosIngredientesEntity>,
        @InjectRepository(IngredientesEntity)
        private ingredienteRepository: Repository<IngredientesEntity>,
        private s3Service: S3Service
    ) { }

    async adicionar(produto: ProdutoDTO & { files: Express.Multer.File[] }) { // Cria um novo produto
        if (produto.files.length === 0) { throw new BadRequestException('Arquivo de imagem é obrigatório.') }
        const extensoesValidas = ['.jpg', '.png', '.gif', '.jpeg']; // Defina as extensões permitidas
        produto.files.map((foto) => {
            const isExtensaoValida = extensoesValidas.some(extensao => foto.originalname.toLowerCase().endsWith(extensao));
            if (!isExtensaoValida) { throw new BadRequestException('O arquivo deve ser uma imagem válida.') }
            if (!foto.mimetype.startsWith('image/')) { throw new BadRequestException('O arquivo deve ser uma imagem.') }
        })
        const categoria = await this.categoriaRepository.findOne({ where: { id: produto.categoriaId }, });
        if (!categoria) throw new NotFoundException('Categoria não encontrada');
        const produtoExistente = await this.produtoRepository.findOne({
            where: {
                titulo: produto.titulo,
                categoria: { id: categoria.id }
            },
            relations: ['categoria']
        });
        if (produtoExistente) { throw new ConflictException('Já existe um produto com esse título nesta categoria') }
        let produtoEntity = new ProdutoEntity;
        const imagensUpload = await Promise.all(produto.files.map(async (foto) => {
            const uploadResult = await this.s3Service.upload(foto, 'eudelivery-produtos');
            // Remover as aspas duplas ao redor do ETag usando regex
            uploadResult.ETag = uploadResult.ETag.replace(/"/g, '');
            return uploadResult;
        }));
        // Preenche o array imgs com os resultados dos uploads
        produtoEntity.imgs.push(...imagensUpload);
        Object.assign(produtoEntity, produto)
        const produtoSaved = await this.produtoRepository.save(produtoEntity);
        produtoSaved.categoria = produtoEntity.categoria = categoria
        await this.produtoRepository.save(produtoSaved);
        return this.produtoRepository.findOne({ where: { id: produtoSaved.id } })
    }

    async adicionarAdicional(adicionarAdicional: AddAdicionalProdutoDTO) {
        const produto = await this.produtoRepository.findOne({ where: { id: adicionarAdicional.produtoId }, relations: ['adicionais'] })
        if (!produto) throw new NotFoundException('Produto não encontrado.');
        const isExist = produto.adicionais.some((item) => { return item.id == adicionarAdicional.ingredienteId });
        if (isExist) throw new ConflictException('Adicional já cadastrado nesse produto.');
        const ingrediente = await this.ingredienteRepository.findOne({ where: { id: adicionarAdicional.ingredienteId } });
        if (!ingrediente) throw new NotFoundException('Ingrediente não cadastrado.')
        produto.adicionais.push(ingrediente)
        return this.produtoRepository.save(produto);
    }

    async deletarAdicional(produtoDTO: DeletarAdicionalProdutoDTO) {
        const produto = await this.produtoRepository.findOne({ where: { id: produtoDTO.produtoId }, relations: ['adicionais'] })
        if (!produto) throw new NotFoundException('Produto não encontrado.');
        const isExist = produto.adicionais.some((item) => { return item.id == produtoDTO.ingredienteId });
        if (!isExist) throw new ConflictException('Adicional não está cadastrado nesse produto.');
        const adicionais = produto.adicionais.filter((item)=>{return item.id != produtoDTO.ingredienteId})
        produto.adicionais = adicionais
        return this.produtoRepository.save(produto);
    }

    async adicionarFoto(foto: AddFotoProdutoDTO & { file: Express.Multer.File }) { // Cria um novo produto
        const produto = await this.produtoRepository.findOne({ where: { id: foto.produtoId } });
        if (!produto) throw new NotFoundException('Produto não encontrado.');
        const extensoesValidas = ['.jpg', '.png', '.gif', '.jpeg']; // Defina as extensões permitidas
        const isExtensaoValida = extensoesValidas.some(extensao => foto.file.originalname.toLowerCase().endsWith(extensao));
        if (!isExtensaoValida) { throw new BadRequestException('O arquivo deve ser uma imagem válida.') }
        if (!foto.file.mimetype.startsWith('image/')) { throw new BadRequestException('O arquivo deve ser uma imagem.') }
        const fotoAdicionada = await this.s3Service.upload(foto.file, "eudelivery-produtos")
        produto.imgs.push(fotoAdicionada);
        const produtoSalvo = await this.produtoRepository.save(produto);
        delete produtoSalvo.produtosIngredientes
        return produtoSalvo;
    }



    async buscarPorCategoria(categoria: string) { // Lista um produto pelo ID
        if (!categoria || categoria == "") { throw new BadRequestException("Categoria não pode ser vazio.") }
        const produto = await this.produtoRepository.find({ where: { categoria: { titulo: categoria } } });
        if (!produto) { throw new NotFoundException(`Produto com a categoria ${categoria} não encontrado.`); }
        return produto;
    }

    async deletarProduto(data: { produtoId: number }) {
        const produto = await this.produtoRepository.findOne({ where: { id: data.produtoId } });
        if (!produto) throw new NotFoundException('Produto não encontrado.')
        await Promise.all(produto.imgs.map(async (img) => { await this.s3Service.delete(img.Key, img.Bucket); }));
        return this.produtoRepository.delete(data.produtoId);
    }


    async deletarFotoProduto(data: { produtoId: number, etag: string }) {
        const produto = await this.produtoRepository.findOne({ where: { id: data.produtoId } });
        if (!produto) throw new NotFoundException('Produto não encontrado.')
        const imgDelete = produto.imgs.find((item) => { return item.ETag == data.etag });
        const imagensFiltradas = produto.imgs.filter((item) => { return item.ETag != data.etag });
        await this.s3Service.delete(imgDelete.Key, imgDelete.Bucket);
        produto.imgs = imagensFiltradas;
        return await this.produtoRepository.save(produto)
    }


    async adicionarIngredientes(produto: AddProductIngrentDTO) { // Adiciona um ingrediente a um produto
        const produtoEntity = await this.produtoRepository.findOne({ where: { id: produto.produtoId }, });
        if (!produtoEntity) throw new NotFoundException(`Produto com ID ${produto.produtoId} não encontrado.`);
        const ingredienteEntity = await this.ingredienteRepository.findOne({ where: { id: produto.ingredienteId } });
        if (!ingredienteEntity) throw new NotFoundException(`Ingrediente com ID ${produto.ingredienteId} não encontrado.`);
        const IsInvalid = await this.produtoIngredienteRepository.findOne({ where: { produto: { id: produtoEntity.id }, ingrediente: { id: ingredienteEntity.id } } });
        if (IsInvalid) throw new ConflictException('Ingrediente já cadastrado.');
        await this.produtoIngredienteRepository.save({ id: null, produto: produtoEntity, ingrediente: ingredienteEntity, quantia: produto.quantia, removivel: produto.removivel });
        const produtoResult = await this.produtoRepository.findOne({
            where: { id: produto.produtoId },
            relations: ['produtosIngredientes', 'produtosIngredientes.ingrediente'], // Carregar as relações de ingredientes
        });
        const produtoFormatado = {
            ...produtoResult,
            produtosIngredientes: produtoResult.produtosIngredientes.map(pi => ({
                id: pi.id,
                quantia: pi.quantia,
                removivel: pi.removivel,
                nomeIngrediente: pi.ingrediente.nome, // Pega o nome do ingrediente diretamente
                valorIngrediente: pi.ingrediente.valor // Pega o valor do ingrediente diretamente
            }))
        };
        return produtoFormatado;
    }

        async buscarPorId(produtoId: number) { // Lista um produto pelo ID
            const produtoResult = await this.produtoRepository.findOne({
                where: { id: produtoId },
                relations: ['produtosIngredientes','produtosIngredientes.ingrediente','adicionais'], // Carregar as relações de ingredientes
            });
            if (!produtoResult) { throw new NotFoundException(`Produto com ID ${produtoId} não encontrado.`); }
    
            const produtoFormatado = {
                ...produtoResult,
                ingredientes: produtoResult.produtosIngredientes.map(pi => ({
                    id: pi.id,
                    quantia: pi.quantia,
                    removivel: pi.removivel,
                    nomeIngrediente: pi.ingrediente.nome, // Pega o nome do ingrediente diretamente
                    valorIngrediente: pi.ingrediente.valor // Pega o valor do ingrediente diretamente
                }))
            };
            delete produtoFormatado.produtosIngredientes
            return produtoFormatado;
    }

}
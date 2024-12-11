
class GerarQrcodePixUtils {
    private getLen(str: string): string {
        return str.length.toString().padStart(2, '0') + str;
    }

    private getCRC16(payload: string): string {
        const ID_CRC16 = '6304';
        payload += ID_CRC16;
        let polinomio = 0x1021;
        let resultado = 0xFFFF;

        for (let i = 0; i < payload.length; i++) {
            resultado ^= (payload.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if ((resultado <<= 1) & 0x10000) resultado ^= polinomio;
                resultado &= 0xFFFF;
            }
        }

        return ID_CRC16 + resultado.toString(16).toUpperCase();
    }

    public async criarPedido(valor:string,descricao:string,chavepix:string) {
        try {
            const texto = `00020126${this.getLen(`0014BR.GOV.BCB.PIX01${this.getLen(chavepix)}02${this.getLen(descricao)}`)}` +
                `52040000530398654${this.getLen(valor.toString())}` +
                `5802BR59${this.getLen('SEUDEV')}` +`60${this.getLen('SAO JOSE')}` + `62${this.getLen(`05${this.getLen(descricao)}`)}`;

            const crc = this.getCRC16(texto);

            return texto + crc
        } catch (e:any) {
            console.log(e.message);
            return null;

        }
    }
}

export default GerarQrcodePixUtils;
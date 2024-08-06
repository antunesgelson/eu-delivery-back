/*
função que filtra o dto e retorna apenas os dados que estão no DTO.
*/
export function filtroDTO<T>(dto:T, source:Partial<T>): T {
    Object.keys(dto).forEach(key=>{
        if(key in source){
            (dto as any)[key] = source[key];
        }
    });
    return dto;
}
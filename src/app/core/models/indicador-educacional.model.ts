export interface IndicadorEducacional {
  id: string;
  escolaId: string;
  escolaNome: string;
  municipioId: string;
  municipioNome: string;
  ano: number;
  matriculaInicial: number;
  aprovados: number;
  reprovados: number;
  abandono: number;
  taxaAprovacao: number;
  taxaAbandono: number;
}
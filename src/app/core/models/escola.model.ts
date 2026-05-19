export interface Escola {
  id: string;
  nome: string;
  municipioId: string;
  municipioNome: string;
  rede: 'estadual' | 'municipal';
}
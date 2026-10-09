export type ProductInformationData = {
  tag: string;
  subtitle: string;
  weight: string;
  ingredients: string;
  highlights?: string;
  usage?: string;
};
export function ProductInformation({
  product: p,
}: {
  product: ProductInformationData;
}) {
  const highlights = p.highlights?.trim()
    ? p.highlights
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean)
    : [p.tag, p.subtitle, p.weight ? `Embalagem de ${p.weight}` : ""].filter(
        Boolean,
      );
  return (
    <>
      {!!highlights.length && (
        <section className="product-information">
          <h3>Destaques</h3>
          <ul>
            {highlights.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </section>
      )}
      {p.usage?.trim() && (
        <section className="product-information">
          <h3>Como usar ou consumir</h3>
          <p>{p.usage}</p>
        </section>
      )}
      <section className="product-information">
        <h3>Ingredientes e cuidados</h3>
        {p.ingredients && <p>{p.ingredients}</p>}
        <small>
          Confira os ingredientes no rótulo e a disponibilidade com a loja.
        </small>
      </section>
    </>
  );
}

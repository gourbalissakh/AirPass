/**
 * Bandeau d'images qui défile en boucle.
 *
 * La liste est écrite deux fois côte à côte et le rail glisse de -50 % :
 * quand la première moitié sort à gauche, la seconde est exactement à sa
 * place et la boucle est invisible. Les bords sont fondus par `masque-bords`
 * pour que rien n'apparaisse ni ne disparaisse d'un coup.
 *
 * L'animation est portée par une variable CSS, donc neutralisée d'office
 * par la règle « réduire les animations » de index.css.
 */
export default function Bandeau({ images, hauteur = 'h-28 sm:h-36', rapide = false }) {
  const rail = [...images, ...images]

  return (
    <div className="masque-bords relative overflow-hidden py-1">
      <ul
        className={`flex w-max gap-4 ${rapide ? 'animate-derive-rapide' : 'animate-derive-lente'}`}
      >
        {rail.map((image, i) => (
          <li
            key={`${image.src}-${i}`}
            className={`group relative ${hauteur} w-44 shrink-0 overflow-hidden rounded-xl
                        ring-1 ring-bordure sm:w-60`}
          >
            <img
              src={image.src}
              alt={image.legende}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ objectPosition: image.origine }}
            />
            <span
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, #000000b3, #0000001a 55%, transparent)' }}
            />
            <span className="absolute inset-x-0 bottom-0 truncate px-3 pb-2 text-[11px]
                             font-semibold text-white/85">
              {image.legende}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

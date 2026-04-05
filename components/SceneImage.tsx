import Image from 'next/image'

const DEFAULT_SCENE = '/scenarios/default.jpg'

type Props = {
  image: string
  title?: string
}

export default function SceneImage({ image, title }: Props) {
  const src = image?.trim() ? image : DEFAULT_SCENE

  return (
    <div className="relative w-full h-48 md:h-64 rounded-xl shadow-md overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 1280px) 100vw, 1280px"
        priority
      />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden />
      {title ? (
        <p className="absolute bottom-3 left-4 z-10 text-white text-lg font-semibold drop-shadow-sm">
          {title}
        </p>
      ) : null}
    </div>
  )
}

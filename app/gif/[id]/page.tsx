import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGifById } from "@/lib/providers/multi";
import { GifDetailPage } from "@/components/GifDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gif = await getGifById(id);
  if (!gif) return { title: "GIF not found" };

  return {
    title: `${gif.title || "GIF"} — Jiffy`,
    description: "Found on Jiffy — the fastest way to find, copy & share GIFs.",
    openGraph: {
      title: gif.title || "Check out this GIF",
      description: "Found on Jiffy — the fastest way to find, copy & share GIFs.",
      images: [{ url: gif.gifUrl, width: gif.width, height: gif.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: gif.title || "Check out this GIF",
      images: [gif.gifUrl],
    },
  };
}

export default async function GifPage({ params }: Props) {
  const { id } = await params;
  const gif = await getGifById(id);
  if (!gif) notFound();

  return <GifDetailPage gif={gif} />;
}

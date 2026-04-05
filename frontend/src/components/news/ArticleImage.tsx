"use client";
import { useState } from "react";
import Image from "next/image";
import { CategoryArt } from "./CategoryArt";

interface Props {
  imageUrl: string | null;
  category: string | null;
  title: string;
  className?: string;
}

export function ArticleImage({ imageUrl, category, title, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          onError={() => setFailed(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        {/* Gradient overlay so text is always readable on top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <CategoryArt category={category} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}

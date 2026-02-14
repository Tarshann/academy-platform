import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ResponsiveImage } from "@/components/ResponsiveImage";

interface SearchResult {
  type: "program" | "product" | "gallery" | "video";
  id: number;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: programs } = trpc.programs.list.useQuery(undefined, {
    enabled: isOpen && query.length > 0,
  });
  const { data: products } = trpc.shop.products.useQuery(undefined, {
    enabled: isOpen && query.length > 0,
  });
  const { data: photos } = trpc.gallery.list.useQuery(undefined, {
    enabled: isOpen && query.length > 0,
  });
  const { data: videos } = trpc.videos.list.useQuery(undefined, {
    enabled: isOpen && query.length > 0,
  });

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchTerm = query.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search programs
    if (programs) {
      programs.forEach((program: any) => {
        if (
          program.name.toLowerCase().includes(searchTerm) ||
          program.description?.toLowerCase().includes(searchTerm) ||
          String(program.slug ?? "")
            .toLowerCase()
            .includes(searchTerm)
        ) {
          const anchorId = program.slug
            ? `program-${program.slug}`
            : `program-${program.id}`;
          searchResults.push({
            type: "program",
            id: program.id,
            title: program.name,
            description: program.description ?? undefined,
            url: `/programs#${anchorId}`,
          });
        }
      });
    }

    // Search products
    if (products) {
      products.forEach((product: any) => {
        if (
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
        ) {
          searchResults.push({
            type: "product",
            id: product.id,
            title: product.name,
            description: product.description ?? undefined,
            url: `/shop#product-${product.id}`,
            imageUrl: product.imageUrl ?? undefined,
          });
        }
      });
    }

    // Search gallery photos
    if (photos) {
      photos.forEach((photo: any) => {
        if (
          photo.title.toLowerCase().includes(searchTerm) ||
          photo.description?.toLowerCase().includes(searchTerm) ||
          photo.category.toLowerCase().includes(searchTerm)
        ) {
          searchResults.push({
            type: "gallery",
            id: photo.id,
            title: photo.title,
            description: photo.description ?? undefined,
            url: `/gallery#photo-${photo.id}`,
            imageUrl: photo.imageUrl ?? undefined,
          });
        }
      });
    }

    // Search videos
    if (videos) {
      videos.forEach((video: any) => {
        if (
          video.title.toLowerCase().includes(searchTerm) ||
          video.description?.toLowerCase().includes(searchTerm) ||
          video.category.toLowerCase().includes(searchTerm)
        ) {
          searchResults.push({
            type: "video",
            id: video.id,
            title: video.title,
            description: video.description ?? undefined,
            url: `/videos#video-${video.id}`,
            imageUrl: video.thumbnailUrl ?? undefined,
          });
        }
      });
    }

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
    setIsSearching(false);
  }, [query, programs, products, photos, videos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} noValidate className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search programs, products, gallery..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={clearSearch}
              aria-label="Clear search"
              formNoValidate
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            className="h-8 w-8"
            disabled={query.trim().length < 2}
            aria-label="Search"
            onClick={handleSearch}
            formNoValidate
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map(result => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.url}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="block p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {result.imageUrl && (
                        <ResponsiveImage
                          src={result.imageUrl}
                          alt={result.title}
                          className="w-12 h-12 object-cover rounded"
                          sizes="48px"
                          width={48}
                          height={48}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">
                            {result.type}
                          </span>
                          <p className="font-semibold text-sm truncate">
                            {result.title}
                          </p>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

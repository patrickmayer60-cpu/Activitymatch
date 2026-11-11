import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import type { PublicListing } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CityCombobox } from "@/components/city-combobox";
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  User,
  Trophy,
  Dumbbell,
  Gamepad2,
  Music,
  Trees,
  MoreHorizontal,
  Clock,
  Filter,
  X,
  Repeat,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const CATEGORIES = ["Sport", "Gaming", "Musik", "Outdoor", "Fitness", "Sonstiges"] as const;
const LEVELS = ["Anfänger", "Amateur", "Profi"] as const;

const categoryIcons: Record<string, typeof Trophy> = {
  Sport: Trophy,
  Gaming: Gamepad2,
  Musik: Music,
  Outdoor: Trees,
  Fitness: Dumbbell,
  Sonstiges: MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  Sport: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Gaming: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Musik: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Outdoor: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  Fitness: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Sonstiges: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

const levelColors: Record<string, string> = {
  "Anfänger": "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  "Amateur": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Profi": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function ListingCardSkeleton() {
  return (
    <Card className="border border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const CategoryIcon = categoryIcons[listing.category] || MoreHorizontal;

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover-elevate cursor-pointer transition-all duration-200 h-full">
        <CardContent className="p-4 sm:p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-base leading-tight line-clamp-2" data-testid={`text-title-${listing.id}`}>
              {listing.title}
            </h3>
            <div className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[listing.category]}`}>
              <CategoryIcon className="w-3 h-3" />
              {listing.category}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow" data-testid={`text-description-${listing.id}`}>
            {listing.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-auto">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.city}
            </span>
            {listing.activityDate ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(listing.activityDate)}
                </span>
                {listing.activityTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {listing.activityTime}
                  </span>
                )}
                {listing.recurrence && listing.recurrence !== "Einmalig" && (
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <Repeat className="w-3 h-3" />
                    {listing.recurrence}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <Calendar className="w-3 h-3" />
                Flexibel
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {listing.name}, {listing.age}
            </span>
            <div className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColors[listing.level]}`}>
              {listing.level}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (categoryFilter && categoryFilter !== "all") params.set("category", categoryFilter);
    if (levelFilter && levelFilter !== "all") params.set("level", levelFilter);
    if (searchText) params.set("search", searchText);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [cityFilter, categoryFilter, levelFilter, searchText]);

  const { data: listings, isLoading } = useQuery<PublicListing[]>({
    queryKey: ["/api/listings" + queryParams],
  });

  const hasFilters = cityFilter || (categoryFilter && categoryFilter !== "all") || (levelFilter && levelFilter !== "all") || searchText;

  const clearFilters = () => {
    setSearchText("");
    setCityFilter("");
    setCategoryFilter("all");
    setLevelFilter("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <BrandLogo className="h-11 sm:h-14 object-contain cursor-pointer" data-testid="link-home" />
            </Link>
            <Link href="/create">
              <Button data-testid="button-create-listing">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Anzeige erstellen</span>
                <span className="sm:hidden">Erstellen</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-6">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Aktivität suchen..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2 animate-in slide-in-from-top-2 duration-200">
              <div className="sm:w-64">
                <CityCombobox
                  value={cityFilter}
                  onChange={setCityFilter}
                  placeholder="Stadt filtern..."
                  data-testid="input-city-filter"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="sm:w-48" data-testid="select-level-filter">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Levels</SelectItem>
                  {LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start" data-testid="button-clear-filters">
                  <X className="w-3 h-3 mr-1" />
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-results-count">
              {listings.length} {listings.length === 1 ? "Anzeige" : "Anzeigen"} gefunden
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2" data-testid="text-no-results">Keine Anzeigen gefunden</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {hasFilters
                ? "Versuche es mit anderen Filtern oder erstelle eine neue Anzeige."
                : "Sei der Erste und erstelle eine Anzeige, um Leute für eine Aktivität zu finden!"}
            </p>
            <Link href="/create">
              <Button data-testid="button-create-first">
                <Plus className="w-4 h-4 mr-1" />
                Anzeige erstellen
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

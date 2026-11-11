import { ContactForm } from "@/components/contact-form";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import type { PublicListing } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageCircle,
  Trophy,
  Dumbbell,
  Gamepad2,
  Music,
  Trees,
  MoreHorizontal,
  Trash2,
  Loader2,
  Repeat,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

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

const genderLabels: Record<string, string> = {
  "Männlich": "Männlich",
  "Weiblich": "Weiblich",
  "Divers": "Divers",
  "Keine Angabe": "Keine Angabe",
};

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteKey, setDeleteKey] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const id = params?.id ? parseInt(params.id) : 0;

  const { data: listing, isLoading, error } = useQuery<PublicListing>({
    queryKey: ["/api/listings", id],
    enabled: id > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/listings/${id}`, { secretKey: deleteKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Anzeige gelöscht", description: "Deine Anzeige wurde erfolgreich gelöscht." });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: "Ungültiger Secret-Key oder Anzeige nicht gefunden.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <BrandLogo className="h-11 sm:h-14 object-contain" />
          </div>
        </header>
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <Link href="/">
              <BrandLogo className="h-11 sm:h-14 object-contain cursor-pointer" />
            </Link>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-20 text-center">
          <h2 className="text-xl font-semibold mb-2">Anzeige nicht gefunden</h2>
          <p className="text-muted-foreground mb-6">Diese Anzeige existiert nicht oder wurde gelöscht.</p>
          <Link href="/">
            <Button data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[listing.category] || MoreHorizontal;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <BrandLogo className="h-11 sm:h-14 object-contain cursor-pointer" data-testid="link-home" />
            </Link>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-overview">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Zurück</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[listing.category]}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              {listing.category}
            </div>
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${levelColors[listing.level]}`}>
              {listing.level}
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-listing-title">{listing.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {listing.city}
            </span>
            {listing.activityDate ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(listing.activityDate)}
                </span>
                {listing.activityTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {listing.activityTime} Uhr
                  </span>
                )}
                {listing.recurrence && listing.recurrence !== "Einmalig" && (
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <Repeat className="w-4 h-4" />
                    {listing.recurrence}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <Calendar className="w-4 h-4" />
                Flexibel
              </span>
            )}
          </div>
        </div>

        <Card className="border border-border">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold mb-3">Beschreibung</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-listing-description">
              {listing.description}
            </p>
          </CardContent>
        </Card>

        {listing.matchPreference && (
          <Card className="border border-border">
            <CardContent className="p-4 sm:p-5">
              <h3 className="font-semibold mb-3">Wen suche ich?</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-match-preference">{listing.matchPreference}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border border-border">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold mb-3">Über die Person</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium" data-testid="text-listing-name">{listing.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Alter</p>
                  <p className="text-sm font-medium" data-testid="text-listing-age">{listing.age} Jahre</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Geschlecht</p>
                  <p className="text-sm font-medium" data-testid="text-listing-gender">{genderLabels[listing.gender] || listing.gender}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-semibold mb-3">Kontakt</h3>
            <div className="space-y-3">
              <ContactForm listingId={listing.id} canContact={listing.canContact} />
              {listing.contactNote && (
                <div className="flex items-center gap-3 text-sm rounded-md p-2 -mx-2" data-testid="text-contact-note">
                  <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <span className="text-muted-foreground">{listing.contactNote}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive" data-testid="button-delete-listing">
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Anzeige löschen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anzeige löschen</DialogTitle>
                <DialogDescription>
                  Gib deinen Secret-Key ein, den du beim Erstellen der Anzeige erhalten hast.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Secret-Key eingeben"
                  value={deleteKey}
                  onChange={(e) => setDeleteKey(e.target.value)}
                  data-testid="input-delete-key"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
                    Abbrechen
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={!deleteKey || deleteMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Löschen"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

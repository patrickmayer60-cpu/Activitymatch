import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Listing } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  Lock,
  Loader2,
  MapPin,
  Calendar,
  Eye,
  LogOut,
} from "lucide-react";
import logoImage from "@assets/image_1772317603904.png";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);
  const { toast } = useToast();

  const sessionQuery = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/session"],
  });

  const authenticated = sessionQuery.data?.authenticated ?? false;

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
    enabled: authenticated,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      return res.json();
    },
    onSuccess: () => {
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Falsches Passwort",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/listings/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      setDeleteDialogId(null);
      toast({ title: "Gelöscht", description: "Anzeige wurde erfolgreich gelöscht." });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Anzeige konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/">
                <img src={logoImage} alt="ActivityMatch" className="h-11 sm:h-14 object-contain cursor-pointer" data-testid="link-home" />
              </Link>
              <Link href="/">
                <Button variant="outline" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Zurück</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-sm mx-auto px-3 sm:px-4 py-20">
          <Card className="border border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle>Admin-Bereich</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loginMutation.mutate();
                }}
                className="space-y-4"
              >
                <Input
                  type="password"
                  placeholder="Admin-Passwort eingeben"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                />
                <Button type="submit" className="w-full" disabled={!password || loginMutation.isPending} data-testid="button-admin-login">
                  {loginMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Anmelden"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <img src={logoImage} alt="ActivityMatch" className="h-11 sm:h-14 object-contain cursor-pointer" data-testid="link-home" />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className="no-default-active-elevate hidden sm:inline-flex">Admin</Badge>
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Zurück</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} data-testid="button-admin-logout">
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h2 className="text-2xl font-bold mb-1" data-testid="text-admin-title">Anzeigen verwalten</h2>
        <p className="text-muted-foreground mb-6">
          {listings ? `${listings.length} Anzeigen insgesamt` : "Lade..."}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border border-border animate-pulse">
                <CardContent className="p-4 h-16" />
              </Card>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="border border-border">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm truncate" data-testid={`text-admin-title-${listing.id}`}>
                          {listing.title}
                        </h3>
                        <Badge variant="secondary" className="no-default-active-elevate text-xs">
                          {listing.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.city}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {listing.activityDate}
                        </span>
                        <span>{listing.name}, {listing.age}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/listing/${listing.id}`}>
                        <Button size="icon" variant="outline" data-testid={`button-view-${listing.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Dialog open={deleteDialogId === listing.id} onOpenChange={(open) => setDeleteDialogId(open ? listing.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="outline" className="text-destructive" data-testid={`button-delete-${listing.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Anzeige löschen?</DialogTitle>
                            <DialogDescription>
                              "{listing.title}" von {listing.name} wird unwiderruflich gelöscht.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setDeleteDialogId(null)} data-testid="button-cancel-delete">
                              Abbrechen
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(listing.id)}
                              disabled={deleteMutation.isPending}
                              data-testid="button-confirm-delete"
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Löschen"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Keine Anzeigen vorhanden.</p>
          </div>
        )}
      </div>
    </div>
  );
}


"use client"

import { Bell, User, LogOut, ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User as UserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, doc, where, orderBy, limit } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AppNavbarProps {
  currentUser: UserType;
  onLogout: () => void;
}

export function AppNavbar({ currentUser, onLogout }: AppNavbarProps) {
  const db = useFirestore();
  
  // Notification Logic
  const notificationsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    const path = currentUser.role === 'admin' ? `admins/${currentUser.id}/notifications` : `employees/${currentUser.id}/notifications`;
    return query(collection(db, path));
  }, [db, currentUser]);

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    (notifications || []).forEach(notif => {
      if (!notif.isRead) {
        const path = currentUser.role === 'admin' ? `admins/${currentUser.id}/notifications` : `employees/${currentUser.id}/notifications`;
        updateDocumentNonBlocking(doc(db, path, notif.id), { isRead: true });
      }
    });
  };

  // Meeting Logic
  const activeMeetingQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'meetings'),
      where('status', '==', 'active'),
      orderBy('startTime', 'desc'),
      limit(1)
    );
  }, [db]);
  const { data: activeMeetings } = useCollection(activeMeetingQuery);
  const activeMeeting = activeMeetings?.[0];

  const handleJoinMeeting = () => {
    if (activeMeeting) {
      toast({ title: "Connecting...", description: "Joining the virtual executive lounge." });
      window.open(activeMeeting.url, '_blank');
    } else {
      toast({ title: "Virtual Sync", description: "No active meetings currently in session." });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLogout}
          className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg relative border border-primary/20 bg-white">
            <Image src="https://img.sanishtech.com/u/ceb6a7135c1691ad1881a0eaea4200e9.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary hidden sm:block">WonderlightAdventure</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "transition-all duration-500",
            activeMeeting 
              ? "text-accent animate-luxury-pulse scale-110 bg-accent/10 rounded-full" 
              : "text-muted-foreground hover:text-accent"
          )}
          onClick={handleJoinMeeting}
        >
          <Video className={cn("h-5 w-5", activeMeeting && "animate-bell")} />
        </Button>

        <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className={cn(
                "h-5 w-5 transition-colors", 
                unreadCount > 0 ? "animate-bell text-accent" : "text-muted-foreground group-hover:text-primary"
              )} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-primary badge-pulse">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden luxury-shadow border-primary/10">
            <DropdownMenuLabel className="p-4 bg-muted/50 border-b flex items-center justify-between">
              <span>Executive Alerts</span>
              {unreadCount > 0 && <Badge variant="outline" className="text-[10px] animate-luxury-pulse">{unreadCount} New</Badge>}
            </DropdownMenuLabel>
            <ScrollArea className="h-80">
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No notifications recorded in the vault.
                </div>
              ) : (
                [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-4 border-b transition-all duration-300", 
                      !notif.isRead ? "bg-primary/5 border-l-4 border-l-accent" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-[10px] uppercase tracking-widest text-primary/70">
                        {notif.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className={cn("text-xs leading-relaxed", !notif.isRead ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-1 pr-3 rounded-full hover:bg-muted transition-all duration-300">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter font-bold">{currentUser.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 luxury-shadow border-primary/10">
            <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
              My Portfolio
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-4 py-2">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Secure Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

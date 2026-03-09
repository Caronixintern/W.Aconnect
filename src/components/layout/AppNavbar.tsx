
"use client"

import { Bell, User, LogOut, ArrowLeft } from "lucide-react";
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
import { collection, query, doc } from "firebase/firestore";

interface AppNavbarProps {
  currentUser: UserType;
  onLogout: () => void;
}

export function AppNavbar({ currentUser, onLogout }: AppNavbarProps) {
  const db = useFirestore();
  
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-card px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLogout}
          className="rounded-full h-8 w-8 md:h-10 md:w-10 hover:bg-primary/10 hover:text-primary transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden shadow-lg relative border border-primary/20 bg-white shrink-0">
            <Image src="https://img.sanishtech.com/u/ceb6a7135c1691ad1881a0eaea4200e9.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <span className="text-base md:text-xl font-bold tracking-tight text-primary hidden sm:block truncate">Wonderlight</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group h-9 w-9">
              <Bell className={cn(
                "h-4 w-4 md:h-5 md:w-5 transition-colors", 
                unreadCount > 0 ? "text-accent animate-bell" : "text-muted-foreground group-hover:text-primary"
              )} />
              {unreadCount > 0 && (
                <Badge className="absolute top-1 right-1 w-3.5 h-3.5 md:w-4 md:h-4 p-0 flex items-center justify-center text-[8px] md:text-[10px] bg-primary badge-pulse">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[90vw] sm:w-80 p-0 overflow-hidden luxury-shadow border-primary/10 mt-2">
            <DropdownMenuLabel className="p-3 md:p-4 bg-muted/50 border-b flex items-center justify-between">
              <span className="text-sm">Alerts</span>
              {unreadCount > 0 && <Badge variant="outline" className="text-[9px]">{unreadCount} New</Badge>}
            </DropdownMenuLabel>
            <ScrollArea className="h-64 md:h-80">
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs italic">
                  No records found.
                </div>
              ) : (
                [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-3 md:p-4 border-b transition-all duration-300", 
                      !notif.isRead ? "bg-primary/5 border-l-4 border-l-accent" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-[9px] uppercase tracking-widest text-primary/70">
                        {notif.type.replace('_', ' ')}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-medium">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className={cn("text-[11px] md:text-xs leading-relaxed", !notif.isRead ? "text-foreground font-medium" : "text-muted-foreground")}>
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
            <Button variant="ghost" className="flex items-center gap-2 md:gap-3 pl-1 pr-1 md:pr-3 rounded-full hover:bg-muted transition-all duration-300 h-9">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-primary/20">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback className="text-[10px]">{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter font-bold">{currentUser.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 md:w-56 luxury-shadow border-primary/10 mt-2">
            <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground px-4 py-2">
              Portfolio
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-4 py-2 text-sm">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

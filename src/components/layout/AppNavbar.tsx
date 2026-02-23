"use client"

import { Bell, User, LogOut, LayoutDashboard, Calendar, ClipboardList, Settings, ArrowLeft } from "lucide-react";
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
import { Role, User as UserType } from "@/lib/types";
import { useOfficeData } from "@/hooks/use-office-data";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AppNavbarProps {
  currentUser: UserType;
  onLogout: () => void;
}

export function AppNavbar({ currentUser, onLogout }: AppNavbarProps) {
  const { notifications, hasNewNotification, clearNotifications } = useOfficeData();

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLogout}
          className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
          title="Return to Home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg transform rotate-3 relative border border-primary/20">
            <Image 
              src="https://img.sanishtech.com/u/ceb6a7135c1691ad1881a0eaea4200e9.jpg" 
              alt="Logo" 
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary hidden sm:block">WonderlightAdventure</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu onOpenChange={(open) => open && clearNotifications()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className={cn("h-5 w-5", hasNewNotification && "animate-bell text-accent")} />
              {userNotifications.length > 0 && !hasNewNotification && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-primary">
                  {userNotifications.length}
                </Badge>
              )}
              {hasNewNotification && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden luxury-shadow">
            <DropdownMenuLabel className="p-4 bg-muted/50 border-b">Notifications</DropdownMenuLabel>
            <ScrollArea className="h-64">
              {userNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No new notifications
                </div>
              ) : (
                userNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 border-b hover:bg-muted/50 transition-colors cursor-default">
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-1 pr-3 rounded-full hover:bg-muted">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentUser.role.toUpperCase()}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 luxury-shadow">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

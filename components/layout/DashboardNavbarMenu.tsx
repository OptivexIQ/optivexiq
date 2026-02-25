"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRef } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions/auth/signOut";

type DashboardNavbarMenuProps = {
  userInitials: string;
};

export default function DashboardNavbarMenu({
  userInitials,
}: DashboardNavbarMenuProps) {
  const initials = userInitials || "";
  const menuClosedByPointerRef = useRef(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onPointerDownCapture={() => {
          menuClosedByPointerRef.current = true;
        }}
        onPointerDownOutside={() => {
          menuClosedByPointerRef.current = true;
        }}
        onInteractOutside={() => {
          menuClosedByPointerRef.current = true;
        }}
        onCloseAutoFocus={(event) => {
          if (menuClosedByPointerRef.current) {
            event.preventDefault();
          }
          menuClosedByPointerRef.current = false;
        }}
      >
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/billing">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-left">
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

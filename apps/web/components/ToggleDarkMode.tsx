import { useTranslation } from "next-i18next";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";

type Props = {
  hideInMobile?: boolean;
};

export default function ToggleDarkMode({ hideInMobile }: Props) {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const updateUserPreference = useUpdateUserPreference();

  if (!user?.theme) return <></>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={hideInMobile ? "hidden sm:flex text-neutral" : "text-neutral"}
        >
          {user?.theme === "light" ? (
            <i className="bi-sun-fill text-xl" />
          ) : user?.theme === "dark" ? (
            <i className="bi-moon-fill text-xl" />
          ) : (
            <i className="bi-circle-half text-xl" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          checked={user?.theme === "light"}
          onSelect={() => {
            updateUserPreference.mutate({ theme: "light" });
            document.documentElement.setAttribute("data-theme", "light");
          }}
        >
          <i className="bi-sun-fill mr-2" />
          {t("light")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={user?.theme === "dark"}
          onSelect={() => {
            updateUserPreference.mutate({ theme: "dark" });
            document.documentElement.setAttribute("data-theme", "dark");
          }}
        >
          <i className="bi-moon-fill mr-2" />
          {t("dark")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={user?.theme === "auto" || !user?.theme}
          onSelect={() => {
            updateUserPreference.mutate({ theme: "auto" });
            document.documentElement.setAttribute("data-theme", "auto");
          }}
        >
          <i className="bi-circle-half mr-2" />
          System
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

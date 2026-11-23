import { Compass } from "lucide-react";
import { Card, EmptyState, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="Page not found"
        message="The page you are looking for doesn't exist."
        action={<LinkButton href="/">Go to dashboard</LinkButton>}
      />
    </Card>
  );
}

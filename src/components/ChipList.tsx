import { Chip, ChipProps } from "@/components/ui/chip";
import { NotificationBadge } from "@/components/ui/notification-badge";

interface ChipListProps {
  items?: Record<string, number>;
  activeItems?: string[];
  onClick?: (item: string) => void;
  color?: ChipProps["color"];
}

export function ChipList(props: ChipListProps) {
  const { items = {}, activeItems = [], onClick, color } = props;

  return (
    <ul className="flex flex-wrap gap-2">
      {Object.entries(items).map(([item, usages]) => (
        <li key={item} className="inline-block">
          <NotificationBadge label={usages === 1 ? 0 : usages}>
            <Chip
              color={color}
              variant={activeItems.includes(item) ? "default" : "outline"}
              onClick={() => onClick?.(item)}
            >
              {item}
            </Chip>
          </NotificationBadge>
        </li>
      ))}
    </ul>
  );
}

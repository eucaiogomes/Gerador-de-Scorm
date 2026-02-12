import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
    id: string;
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

export function SortableItem({ id, isSelected, onClick, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border-2 ${isSelected
                    ? "border-[#FF8C42] bg-[#FF8C42]/10 shadow-md"
                    : "border-transparent hover:border-[#2B4B7C]/30 hover:bg-gray-50"
                } ${isDragging ? "shadow-lg z-50" : ""}`}
            onClick={onClick}
        >
            <button
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex-shrink-0"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}

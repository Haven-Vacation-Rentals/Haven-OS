"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  Hash,
  DollarSign,
  Percent,
  List,
  ListChecks,
  Calendar,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Users,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFieldDef,
  updateFieldDef,
  deleteFieldDef,
  reorderFieldDefs,
} from "@/lib/work/actions";
import { toast } from "sonner";
import type { CustomFieldDef, CustomFieldType } from "@/lib/work/types";

const FIELD_TYPES: { type: CustomFieldType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { type: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { type: "currency", label: "Currency", icon: <DollarSign className="h-4 w-4" /> },
  { type: "percent", label: "Percent", icon: <Percent className="h-4 w-4" /> },
  { type: "select", label: "Select", icon: <List className="h-4 w-4" /> },
  { type: "multi_select", label: "Multi-select", icon: <ListChecks className="h-4 w-4" /> },
  { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "url", label: "URL", icon: <Link className="h-4 w-4" /> },
  { type: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { type: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> },
  { type: "people", label: "People", icon: <Users className="h-4 w-4" /> },
  { type: "labels", label: "Labels", icon: <Tag className="h-4 w-4" /> },
];

function getFieldTypeIcon(type: CustomFieldType): React.ReactNode {
  return FIELD_TYPES.find((f) => f.type === type)?.icon ?? <Type className="h-4 w-4" />;
}

interface SortableFieldRowProps {
  field: CustomFieldDef;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function SortableFieldRow({ field, onNameChange, onDelete }: SortableFieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldDef = FIELD_TYPES.find((f) => f.type === field.field_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-muted-foreground shrink-0">
        {getFieldTypeIcon(field.field_type)}
      </span>

      <Input
        value={field.name}
        onChange={(e) => onNameChange(field.id, e.target.value)}
        className="h-7 flex-1 text-[13px]"
      />

      <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {fieldDef?.label ?? field.field_type}
      </span>

      <button
        type="button"
        onClick={() => onDelete(field.id)}
        className="text-muted-foreground/40 hover:text-rose-500 transition-colors"
        title="Delete field"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface CustomFieldsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  fieldDefs: CustomFieldDef[];
  onFieldDefsChange: (fieldDefs: CustomFieldDef[]) => void;
}

export function CustomFieldsManagerDialog({
  open,
  onOpenChange,
  listId,
  fieldDefs: initialFieldDefs,
  onFieldDefsChange,
}: CustomFieldsManagerDialogProps) {
  const [localFields, setLocalFields] = useState<CustomFieldDef[]>(initialFieldDefs);
  const [pending, startTransition] = useTransition();
  const [showTypePicker, setShowTypePicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleNameChange(id: string, name: string) {
    setLocalFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f)),
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this custom field? All task data for this field will be lost.")) return;
    startTransition(async () => {
      try {
        await deleteFieldDef(id);
        const updated = localFields.filter((f) => f.id !== id);
        setLocalFields(updated);
        onFieldDefsChange(updated);
        toast.success("Field deleted");
      } catch {
        toast.error("Failed to delete field");
      }
    });
  }

  function handleAddField(type: CustomFieldType) {
    setShowTypePicker(false);
    const fieldDef = FIELD_TYPES.find((f) => f.type === type);
    startTransition(async () => {
      try {
        const newField = await createFieldDef(listId, {
          name: fieldDef?.label ?? type,
          field_type: type,
          config: {},
        });
        const updated = [...localFields, newField];
        setLocalFields(updated);
        onFieldDefsChange(updated);
        toast.success("Field added");
      } catch {
        toast.error("Failed to add field");
      }
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        // Update names
        await Promise.all(
          localFields.map((f, i) =>
            updateFieldDef(f.id, { name: f.name, order: i }),
          ),
        );
        // Reorder
        await reorderFieldDefs(listId, localFields.map((f) => f.id));
        onFieldDefsChange(localFields);
        toast.success("Fields saved");
        onOpenChange(false);
      } catch {
        toast.error("Failed to save fields");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Custom Fields</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 py-1 pr-1">
          {localFields.length === 0 && (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              No custom fields yet. Add one below.
            </p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {localFields.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  onNameChange={handleNameChange}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add field button + type picker */}
        {showTypePicker ? (
          <div className="rounded-xl border border-border bg-surface-alt p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Choose field type
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft.type}
                  type="button"
                  onClick={() => handleAddField(ft.type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface p-2.5 text-center hover:border-accent hover:bg-surface-alt transition-colors"
                >
                  <span className="text-muted-foreground">{ft.icon}</span>
                  <span className="text-[11px] font-medium text-foreground">{ft.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTypePicker(false)}
              className="mt-2 text-[12px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowTypePicker(true)}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add field
          </button>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import type { SetDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SetManagementProps {
  set: SetDTO;
}

export function SetManagement({ set }: SetManagementProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editName, setEditName] = useState(set.name);
  const [editDescription, setEditDescription] = useState(set.description || "");

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setIsEditLoading(true);

    try {
      const response = await fetch(`/api/v1/sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Nie udało się zaktualizować zestawu.");
      }

      // Refresh page to show updated data
      window.location.reload();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji zestawu.");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleteLoading(true);

    try {
      const response = await fetch(`/api/v1/sets/${set.id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Nie udało się usunąć zestawu.");
      }

      // Redirect to dashboard after successful delete
      window.location.href = "/dashboard";
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania zestawu.");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setIsEditOpen(true)} className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edytuj
        </Button>
        <Button variant="outline" onClick={() => setIsDeleteOpen(true)} className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Usuń
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj zestaw</DialogTitle>
            <DialogDescription>
              Wprowadź zmiany w nazwie lub opisie zestawu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                {editError}
              </div>
            )}

            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa
              </label>
              <input
                type="text"
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                maxLength={128}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isEditLoading}
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                Opis (opcjonalnie)
              </label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isEditLoading}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isEditLoading}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isEditLoading}>
                {isEditLoading ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <DialogTitle>Usuń zestaw</DialogTitle>
            </div>
            <DialogDescription>
              Czy na pewno chcesz usunąć ten zestaw? Wszystkie fiszki w tym zestawie zostaną trwale usunięte. Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleteLoading}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? "Usuwanie..." : "Usuń zestaw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

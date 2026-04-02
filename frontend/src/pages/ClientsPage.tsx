import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { clientsApi } from '@/api/clients.api';
import { ClientCard } from '@/components/clients/ClientCard';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Client } from '@/types';

interface ClientFormData {
  name: string;
  billingType: 'HOURLY' | 'FIXED';
  hourlyRate: string;
  fixedRate: string;
  monthlyBudget: string;
  notes: string;
  tags: string;
}

const defaultForm: ClientFormData = {
  name: '',
  billingType: 'HOURLY',
  hourlyRate: '',
  fixedRate: '',
  monthlyBudget: '',
  notes: '',
  tags: '',
};

function ClientForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: ClientFormData;
  onSubmit: (data: ClientFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ClientFormData>(initial ?? defaultForm);
  const set = (key: keyof ClientFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <Input label="Client Name" value={form.name} onChange={set('name')} required autoFocus />
      <Select
        label="Billing Type"
        value={form.billingType}
        onChange={set('billingType')}
        options={[
          { label: 'Hourly Rate', value: 'HOURLY' },
          { label: 'Fixed Per Session', value: 'FIXED' },
        ]}
      />
      {form.billingType === 'HOURLY' ? (
        <Input
          label="Hourly Rate ($)"
          type="number"
          min="0"
          step="0.01"
          value={form.hourlyRate}
          onChange={set('hourlyRate')}
          placeholder="e.g. 150"
          required
        />
      ) : (
        <Input
          label="Fixed Rate Per Session ($)"
          type="number"
          min="0"
          step="0.01"
          value={form.fixedRate}
          onChange={set('fixedRate')}
          placeholder="e.g. 200"
          required
        />
      )}
      <Input
        label="Monthly Budget ($ optional)"
        type="number"
        min="0"
        step="0.01"
        value={form.monthlyBudget}
        onChange={set('monthlyBudget')}
        placeholder="e.g. 3000"
      />
      <Input
        label="Tags (comma separated)"
        value={form.tags}
        onChange={set('tags')}
        placeholder="e.g. enterprise, priority"
      />
      <Textarea
        label="Notes (optional)"
        rows={3}
        value={form.notes}
        onChange={set('notes')}
        placeholder="Any notes about this client..."
      />
      <Button type="submit" className="w-full" loading={loading}>
        Save Client
      </Button>
    </form>
  );
}

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (form: ClientFormData) =>
      clientsApi.create({
        name: form.name,
        billingType: form.billingType,
        hourlyRate: form.billingType === 'HOURLY' ? Number(form.hourlyRate) : null,
        fixedRate: form.billingType === 'FIXED' ? Number(form.fixedRate) : null,
        monthlyBudget: form.monthlyBudget ? Number(form.monthlyBudget) : null,
        notes: form.notes || null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: ClientFormData }) =>
      clientsApi.update(id, {
        name: form.name,
        billingType: form.billingType,
        hourlyRate: form.billingType === 'HOURLY' ? Number(form.hourlyRate) : null,
        fixedRate: form.billingType === 'FIXED' ? Number(form.fixedRate) : null,
        monthlyBudget: form.monthlyBudget ? Number(form.monthlyBudget) : null,
        notes: form.notes || null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const clientToFormData = (c: Client): ClientFormData => ({
    name: c.name,
    billingType: c.billingType,
    hourlyRate: c.hourlyRate?.toString() ?? '',
    fixedRate: c.fixedRate?.toString() ?? '',
    monthlyBudget: c.monthlyBudget?.toString() ?? '',
    notes: c.notes ?? '',
    tags: c.tags.join(', '),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-muted text-sm mt-0.5">{clients.length} total</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
          New Client
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted text-sm">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-surface-border rounded-xl">
          <p className="text-muted">No clients yet.</p>
          <Button className="mt-4" onClick={() => setShowAdd(true)} icon={<Plus size={15} />}>
            Add First Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="relative group/card">
              <ClientCard client={client} activeSession={null} />
              {/* Inline actions */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditClient(client); }}
                  className="p-1.5 rounded-lg bg-surface-tertiary text-muted hover:text-white transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete ${client.name}? Session history will be preserved.`)) {
                      deleteMutation.mutate(client.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-surface-tertiary text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Client">
        <ClientForm
          onSubmit={(form) => createMutation.mutate(form)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editClient}
        onClose={() => setEditClient(null)}
        title={`Edit — ${editClient?.name}`}
      >
        {editClient && (
          <ClientForm
            initial={clientToFormData(editClient)}
            onSubmit={(form) => updateMutation.mutate({ id: editClient.id, form })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

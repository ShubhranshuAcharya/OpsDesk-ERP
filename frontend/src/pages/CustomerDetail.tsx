import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { CustomerFormDrawer } from '../components/customers/CustomerFormDrawer';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Edit3, 
  Calendar,
  Building,
  MapPin,
  Clock,
  Send,
  FileText
} from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [activeTab, setActiveTab] = useState('overview');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Note composer state
  const [newNote, setNewNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!id
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { note: newNote };
      if (newFollowUpDate) payload.followUpDate = newFollowUpDate;
      
      await axios.post(`${API_URL}/customers/${id}/notes`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      setNewNote('');
      setNewFollowUpDate('');
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-32 bg-ops-bg-surface rounded-ops-md border border-ops-border-default"></div>
      <div className="h-64 bg-ops-bg-surface rounded-ops-md border border-ops-border-default"></div>
    </div>;
  }

  if (error || !customer) {
    return <EmptyState title="Customer not found" description="The customer you are looking for does not exist or you lack permissions." actionText="Back to list" actionTo="/customers" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Back link */}
      <button 
        onClick={() => navigate('/customers')}
        className="flex items-center text-ops-sm text-ops-text-secondary hover:text-ops-primary transition-colors w-fit"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to customers
      </button>

      {/* Header Card */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-ops-xl font-bold text-ops-text-primary">{customer.name}</h2>
            <StatusBadge status={customer.status} />
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ops-bg-base border border-ops-border-strong text-ops-text-secondary">
              {customer.customerType}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-ops-sm text-ops-text-secondary mt-3">
            {customer.businessName && (
              <span className="flex items-center gap-1.5"><Building size={16} className="text-ops-text-muted" /> {customer.businessName}</span>
            )}
            <span className="flex items-center gap-1.5"><Phone size={16} className="text-ops-text-muted" /> {customer.mobile}</span>
            {customer.email && (
              <span className="flex items-center gap-1.5"><Mail size={16} className="text-ops-text-muted" /> {customer.email}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" onClick={() => window.open(`tel:${customer.mobile}`)}><Phone size={16} className="mr-2" /> Call</Button>
          {customer.email && (
            <Button variant="secondary" onClick={() => window.open(`mailto:${customer.email}`)}><Mail size={16} className="mr-2" /> Email</Button>
          )}
          <Button onClick={() => setIsDrawerOpen(true)}><Edit3 size={16} className="mr-2" /> Edit</Button>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm overflow-hidden">
        <Tabs 
          activeTab={activeTab} 
          onChange={setActiveTab}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'notes', label: 'Follow-up Notes', count: customer.followUpNotes?.length || 0 },
            { id: 'history', label: 'Sales History', count: customer.challans?.length || 0 }
          ]}
        />
        
        <div className="p-6 min-h-[400px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-ops-xs font-semibold text-ops-text-muted uppercase tracking-wider mb-3">Contact Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary">Name</span><span className="col-span-2 font-medium text-ops-text-primary">{customer.name}</span></div>
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary">Mobile</span><span className="col-span-2 font-medium text-ops-text-primary">{customer.mobile}</span></div>
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary">Email</span><span className="col-span-2 font-medium text-ops-text-primary">{customer.email || '—'}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-ops-xs font-semibold text-ops-text-muted uppercase tracking-wider mb-3">Business Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary">Company</span><span className="col-span-2 font-medium text-ops-text-primary">{customer.businessName || '—'}</span></div>
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary">Type</span><span className="col-span-2 font-medium text-ops-text-primary">{customer.customerType}</span></div>
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary">GST No.</span><span className="col-span-2 font-medium text-ops-text-primary">{customer.gstNumber || '—'}</span></div>
                    <div className="grid grid-cols-3 text-ops-sm"><span className="text-ops-text-secondary flex items-start gap-1"><MapPin size={14} className="mt-0.5" /> Address</span><span className="col-span-2 font-medium text-ops-text-primary whitespace-pre-wrap">{customer.address || '—'}</span></div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-ops-xs font-semibold text-ops-text-muted uppercase tracking-wider mb-3">Operations</h3>
                  <div className="space-y-3 bg-ops-bg-base p-4 rounded-ops-md border border-ops-border-default">
                    <div className="flex justify-between items-center pb-3 border-b border-ops-border-strong">
                      <span className="text-ops-sm text-ops-text-secondary">Account Status</span>
                      <StatusBadge status={customer.status} />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-ops-sm text-ops-text-secondary flex items-center gap-1.5"><Calendar size={14} /> Next Follow-up</span>
                      <span className={`text-ops-sm font-medium ${customer.followUpDate && dayjs(customer.followUpDate).isBefore(dayjs(), 'day') ? 'text-ops-danger' : 'text-ops-text-primary'}`}>
                        {customer.followUpDate ? dayjs(customer.followUpDate).format('MMM D, YYYY') : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Composer */}
              <div className="md:w-1/3 shrink-0">
                <div className="sticky top-6 bg-ops-bg-base p-4 rounded-ops-md border border-ops-border-default">
                  <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-3">Add Note</h3>
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Discussed pricing for bulk order..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <Input 
                      label="Schedule Next Follow-up (Optional)"
                      type="date"
                      min={new Date().toISOString().split('T')[0]} // cannot schedule new follow ups in the past
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                    />
                    <Button 
                      className="w-full mt-2" 
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                      isLoading={addNoteMutation.isPending}
                      onClick={() => addNoteMutation.mutate()}
                    >
                      <Send size={14} className="mr-2" /> Add to Timeline
                    </Button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="md:w-2/3">
                {customer.followUpNotes?.length === 0 ? (
                  <EmptyState title="No notes yet" description="Start a conversation log by adding a note from the left panel." />
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ops-border-strong before:to-transparent">
                    {customer.followUpNotes.map((note: any, idx: number) => (
                      <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-ops-bg-surface bg-ops-bg-base text-ops-text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Clock size={14} />
                        </div>
                        
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-ops-bg-surface p-4 rounded-ops-md border border-ops-border-default shadow-sm hover:border-ops-primary transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-ops-sm text-ops-text-primary">{note.createdBy?.name || 'System'}</span>
                            <span className="text-[11px] text-ops-text-muted">{dayjs(note.createdAt).format('MMM D, YYYY h:mm A')}</span>
                          </div>
                          <p className="text-ops-sm text-ops-text-secondary whitespace-pre-wrap">{note.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              {customer.challans?.length === 0 ? (
                <EmptyState icon={<FileText size={24} className="text-ops-text-muted" />} title="No sales history" description="This customer has not placed any orders yet." actionText="Create Challan" actionTo="/challans" />
              ) : (
                <div className="overflow-x-auto border border-ops-border-default rounded-ops-md">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-ops-bg-base border-b border-ops-border-default">
                      <tr>
                        <th className="px-6 py-3 text-ops-xs font-semibold text-ops-text-secondary uppercase">Challan #</th>
                        <th className="px-6 py-3 text-ops-xs font-semibold text-ops-text-secondary uppercase">Date</th>
                        <th className="px-6 py-3 text-ops-xs font-semibold text-ops-text-secondary uppercase">Items</th>
                        <th className="px-6 py-3 text-ops-xs font-semibold text-ops-text-secondary uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ops-border-default">
                      {customer.challans.map((c: any) => (
                        <tr key={c.id} className="hover:bg-ops-bg-base transition-colors cursor-pointer" onClick={() => navigate(`/challans/${c.id}`)}>
                          <td className="px-6 py-4 font-medium text-ops-sm text-ops-text-primary">{c.challanNumber}</td>
                          <td className="px-6 py-4 text-ops-sm text-ops-text-secondary">{dayjs(c.createdAt).format('MMM D, YYYY')}</td>
                          <td className="px-6 py-4 text-ops-sm text-ops-text-secondary">{c.totalQuantity} units</td>
                          <td className="px-6 py-4 text-right"><StatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <CustomerFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        customer={customer}
      />
    </div>
  );
}

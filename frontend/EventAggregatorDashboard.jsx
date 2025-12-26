import React, { useState, useEffect } from 'react';
import { Calendar, Users, Mail, FileText, TrendingUp, MapPin, Clock, DollarSign, CheckCircle, AlertCircle, Search, Filter, Plus, Send, Eye, Edit, Trash2, Download, ArrowRight, Bell, Settings, BarChart3, Zap, Globe, Video, Phone, Star, Target, Layers, RefreshCw } from 'lucide-react';

// ====== GŁÓWNY DASHBOARD MVP ======
export default function EventAggregatorDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState(mockEvents);
  const [leads, setLeads] = useState(mockLeads);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    totalEvents: events.length,
    newThisWeek: events.filter(e => isThisWeek(e.discoveredAt)).length,
    activeLeads: leads.filter(l => l.status === 'active').length,
    conversionRate: Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100),
    pendingOffers: leads.filter(l => l.status === 'offer_sent').length,
    upcomingDeadlines: events.filter(e => isUpcoming(e.date, 14)).length
  };

  const filteredEvents = events.filter(e => {
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nawigacja */}
      <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">StreamFlow</h1>
                <p className="text-xs text-slate-400">Event Aggregator MVP</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {['dashboard', 'events', 'leads', 'offers', 'calendar', 'analytics'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Zawartość główna */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView stats={stats} events={filteredEvents} leads={leads} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'events' && (
          <EventsView 
            events={filteredEvents} 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectEvent={setSelectedEvent}
            onCreateLead={() => setShowNewLeadModal(true)}
          />
        )}
        {activeTab === 'leads' && (
          <LeadsView 
            leads={leads} 
            setLeads={setLeads}
            onSendOffer={() => setShowOfferModal(true)}
          />
        )}
        {activeTab === 'offers' && (
          <OffersView leads={leads} />
        )}
        {activeTab === 'calendar' && (
          <CalendarView events={events} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView stats={stats} events={events} leads={leads} />
        )}
      </main>

      {/* Modals */}
      {showNewLeadModal && (
        <NewLeadModal 
          event={selectedEvent}
          onClose={() => setShowNewLeadModal(false)}
          onSave={(lead) => {
            setLeads([...leads, { ...lead, id: leads.length + 1 }]);
            setShowNewLeadModal(false);
          }}
        />
      )}
      {showOfferModal && (
        <OfferModal 
          onClose={() => setShowOfferModal(false)}
        />
      )}
    </div>
  );
}

// ====== WIDOK DASHBOARD ======
function DashboardView({ stats, events, leads, setActiveTab }) {
  return (
    <div className="space-y-8">
      {/* Karty statystyk */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Calendar} label="Wykryte wydarzenia" value={stats.totalEvents} color="emerald" />
        <StatCard icon={Zap} label="Nowe w tym tygodniu" value={stats.newThisWeek} color="cyan" />
        <StatCard icon={Users} label="Aktywne leady" value={stats.activeLeads} color="violet" />
        <StatCard icon={TrendingUp} label="Konwersja" value={`${stats.conversionRate}%`} color="amber" />
        <StatCard icon={Mail} label="Oczekujące oferty" value={stats.pendingOffers} color="rose" />
        <StatCard icon={Clock} label="Deadline < 14 dni" value={stats.upcomingDeadlines} color="orange" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickAction 
          icon={RefreshCw} 
          title="Synchronizuj źródła" 
          description="Pobierz nowe wydarzenia"
          color="emerald"
          onClick={() => alert('Synchronizacja uruchomiona!')}
        />
        <QuickAction 
          icon={Search} 
          title="Wyszukaj eventy" 
          description="Przeszukaj kalendarze"
          color="cyan"
          onClick={() => setActiveTab('events')}
        />
        <QuickAction 
          icon={Send} 
          title="Wyślij ofertę" 
          description="Do wybranego organizatora"
          color="violet"
          onClick={() => setActiveTab('offers')}
        />
        <QuickAction 
          icon={BarChart3} 
          title="Raport tygodniowy" 
          description="Generuj podsumowanie"
          color="amber"
          onClick={() => alert('Generowanie raportu...')}
        />
      </div>

      {/* Dwie kolumny: Wydarzenia i Leady */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ostatnie wydarzenia */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Nowo wykryte wydarzenia</h2>
            <button 
              onClick={() => setActiveTab('events')}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Zobacz wszystkie <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <EventRow key={event.id} event={event} compact />
            ))}
          </div>
        </div>

        {/* Ostatnie leady */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Aktywne leady</h2>
            <button 
              onClick={() => setActiveTab('leads')}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Zobacz wszystkie <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {leads.filter(l => l.status !== 'lost').slice(0, 5).map(lead => (
              <LeadRow key={lead.id} lead={lead} compact />
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline sprzedażowy */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Pipeline sprzedażowy</h2>
        <div className="grid grid-cols-5 gap-4">
          {pipelineStages.map(stage => (
            <PipelineColumn 
              key={stage.id}
              stage={stage}
              leads={leads.filter(l => l.status === stage.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ====== WIDOK WYDARZEŃ ======
function EventsView({ events, filterStatus, setFilterStatus, searchQuery, setSearchQuery, onSelectEvent, onCreateLead }) {
  return (
    <div className="space-y-6">
      {/* Header z wyszukiwaniem i filtrami */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Wydarzenia</h2>
          <p className="text-slate-400">Agregowane z {aggregationSources.length} źródeł</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Szukaj wydarzeń..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="new">Nowe</option>
            <option value="contacted">Skontaktowano</option>
            <option value="qualified">Kwalifikowane</option>
            <option value="rejected">Odrzucone</option>
          </select>

          <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Więcej filtrów
          </button>
          
          <button 
            onClick={() => alert('Synchronizacja...')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Synchronizuj
          </button>
        </div>
      </div>

      {/* Źródła agregacji */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Źródła danych</h3>
        <div className="flex flex-wrap gap-2">
          {aggregationSources.map(source => (
            <span 
              key={source.id}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                source.active 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
              }`}
            >
              {source.name} ({source.eventCount})
            </span>
          ))}
        </div>
      </div>

      {/* Lista wydarzeń */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Wydarzenie</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Organizator</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Data</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Lokalizacja</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Kategoria</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Potencjał</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-white">{event.name}</p>
                      <p className="text-xs text-slate-400">Źródło: {event.source}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-white">{event.organizer}</p>
                      {event.contact && (
                        <p className="text-xs text-slate-400">{event.contact}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{formatDate(event.date)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {event.location}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(event.category)}`}>
                      {event.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < event.potential ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { onSelectEvent(event); onCreateLead(); }}
                        className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        title="Utwórz lead"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors" title="Szczegóły">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors" title="Edytuj">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ====== WIDOK LEADÓW ======
function LeadsView({ leads, setLeads, onSendOffer }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leady sprzedażowe</h2>
          <p className="text-slate-400">Zarządzaj kontaktami z organizatorami</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Dodaj lead
        </button>
      </div>

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {pipelineStages.map(stage => (
          <div key={stage.id} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <h3 className="font-medium text-white">{stage.name}</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                {leads.filter(l => l.status === stage.id).length}
              </span>
            </div>
            <div className="space-y-3">
              {leads.filter(l => l.status === stage.id).map(lead => (
                <LeadCard key={lead.id} lead={lead} onSendOffer={onSendOffer} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== WIDOK OFERT ======
function OffersView({ leads }) {
  const offersData = leads.filter(l => l.offerSent);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Oferty i umowy</h2>
          <p className="text-slate-400">Szablony i wysłane propozycje</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nowa oferta
        </button>
      </div>

      {/* Pakiety usług */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {servicePackages.map(pkg => (
          <div 
            key={pkg.id}
            className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border ${
              pkg.popular ? 'border-emerald-500/50' : 'border-slate-700/50'
            } p-6 relative`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                Najpopularniejszy
              </span>
            )}
            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
            <p className="text-slate-400 text-sm mb-4">{pkg.description}</p>
            <div className="text-3xl font-bold text-white mb-6">
              {pkg.price} <span className="text-sm text-slate-400 font-normal">PLN netto</span>
            </div>
            <ul className="space-y-2 mb-6">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button className={`w-full py-2 rounded-lg font-medium ${
              pkg.popular 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}>
              Użyj szablonu
            </button>
          </div>
        ))}
      </div>

      {/* Historia ofert */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Wysłane oferty</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-3 text-sm font-medium text-slate-400">Organizator</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Wydarzenie</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Pakiet</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Wartość</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Data wysłania</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left p-3 text-sm font-medium text-slate-400">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {offersData.map(lead => (
                <tr key={lead.id} className="border-b border-slate-700/30">
                  <td className="p-3 text-white">{lead.company}</td>
                  <td className="p-3 text-slate-300">{lead.eventName}</td>
                  <td className="p-3 text-slate-300">{lead.package || 'Standard'}</td>
                  <td className="p-3 text-emerald-400 font-medium">{lead.value} PLN</td>
                  <td className="p-3 text-slate-400">{lead.offerDate || '—'}</td>
                  <td className="p-3"><StatusBadge status={lead.status} /></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="p-1 text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></button>
                      <button className="p-1 text-slate-400 hover:text-white"><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ====== WIDOK KALENDARZA ======
function CalendarView({ events }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Kalendarz wydarzeń</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"
          >
            ←
          </button>
          <span className="px-4 py-2 bg-slate-800 rounded-lg text-white min-w-[150px] text-center">
            {currentMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"
          >
            →
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        {/* Nagłówki dni tygodnia */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Siatka kalendarza */}
        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDays(currentMonth).map((day, i) => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
            return (
              <div 
                key={i}
                className={`min-h-[100px] p-2 rounded-lg border ${
                  day.getMonth() === currentMonth.getMonth()
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : 'bg-slate-900/30 border-slate-800/30'
                } ${isToday(day) ? 'ring-2 ring-emerald-500' : ''}`}
              >
                <span className={`text-sm ${
                  day.getMonth() === currentMonth.getMonth() ? 'text-white' : 'text-slate-600'
                }`}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div 
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 truncate"
                    >
                      {event.name}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-400">+{dayEvents.length - 2} więcej</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista nadchodzących wydarzeń */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Nadchodzące wydarzenia (14 dni)</h3>
        <div className="space-y-3">
          {events
            .filter(e => isUpcoming(e.date, 14))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(event => (
              <EventRow key={event.id} event={event} />
            ))}
        </div>
      </div>
    </div>
  );
}

// ====== WIDOK ANALITYKI ======
function AnalyticsView({ stats, events, leads }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analityka</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Wykryte wydarzenia (miesiąc)" 
          value={events.length}
          change={+12}
          icon={Calendar}
        />
        <MetricCard 
          label="Wysłane oferty" 
          value={leads.filter(l => l.offerSent).length}
          change={+8}
          icon={Mail}
        />
        <MetricCard 
          label="Wygrane kontrakty" 
          value={leads.filter(l => l.status === 'won').length}
          change={+3}
          icon={CheckCircle}
        />
        <MetricCard 
          label="Przychód (PLN)" 
          value={leads.filter(l => l.status === 'won').reduce((sum, l) => sum + l.value, 0).toLocaleString()}
          change={+25}
          icon={DollarSign}
        />
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Źródła wydarzeń */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Źródła wydarzeń</h3>
          <div className="space-y-3">
            {aggregationSources.map(source => (
              <div key={source.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{source.name}</span>
                    <span className="text-slate-400">{source.eventCount}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      style={{ width: `${(source.eventCount / 50) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategorie wydarzeń */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Kategorie wydarzeń</h3>
          <div className="space-y-3">
            {eventCategories.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{cat.name}</span>
                    <span className="text-slate-400">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${(cat.count / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lejek konwersji */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Lejek konwersji</h3>
        <div className="flex items-end justify-between gap-4 h-48">
          {funnelStages.map((stage, i) => (
            <div key={stage.name} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all"
                style={{ height: `${stage.value}%` }}
              />
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-400">{stage.name}</p>
                <p className="text-sm font-medium text-white">{stage.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====== KOMPONENTY POMOCNICZE ======
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-xl rounded-xl border p-4`}>
      <Icon className={`w-5 h-5 mb-2 ${colors[color].split(' ').pop()}`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, color, onClick }) {
  const colors = {
    emerald: 'hover:border-emerald-500/50 hover:bg-emerald-500/10',
    cyan: 'hover:border-cyan-500/50 hover:bg-cyan-500/10',
    violet: 'hover:border-violet-500/50 hover:bg-violet-500/10',
    amber: 'hover:border-amber-500/50 hover:bg-amber-500/10',
  };

  return (
    <button 
      onClick={onClick}
      className={`bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-left transition-all ${colors[color]}`}
    >
      <Icon className="w-6 h-6 text-slate-400 mb-2" />
      <h3 className="font-medium text-white">{title}</h3>
      <p className="text-xs text-slate-400">{description}</p>
    </button>
  );
}

function EventRow({ event, compact }) {
  return (
    <div className={`flex items-center gap-4 ${compact ? 'p-3' : 'p-4'} bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors`}>
      <div className={`w-10 h-10 rounded-lg ${getCategoryBg(event.category)} flex items-center justify-center`}>
        {getCategoryIcon(event.category)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{event.name}</p>
        <p className="text-xs text-slate-400">{event.organizer} • {event.location}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-white">{formatDate(event.date)}</p>
        <StatusBadge status={event.status} small />
      </div>
    </div>
  );
}

function LeadRow({ lead, compact }) {
  return (
    <div className={`flex items-center gap-4 ${compact ? 'p-3' : 'p-4'} bg-slate-700/30 rounded-lg`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
        {lead.company.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{lead.company}</p>
        <p className="text-xs text-slate-400">{lead.contact} • {lead.eventName}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-emerald-400 font-medium">{lead.value} PLN</p>
        <StatusBadge status={lead.status} small />
      </div>
    </div>
  );
}

function LeadCard({ lead, onSendOffer }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
          {lead.company.charAt(0)}
        </div>
        <span className="text-xs text-emerald-400 font-medium">{lead.value} PLN</span>
      </div>
      <h4 className="font-medium text-white text-sm mb-1">{lead.company}</h4>
      <p className="text-xs text-slate-400 mb-2">{lead.eventName}</p>
      <div className="flex items-center gap-2">
        <button className="p-1 text-slate-400 hover:text-emerald-400 transition-colors">
          <Phone className="w-3 h-3" />
        </button>
        <button className="p-1 text-slate-400 hover:text-emerald-400 transition-colors">
          <Mail className="w-3 h-3" />
        </button>
        <button 
          onClick={onSendOffer}
          className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, leads }) {
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
        <span className="text-sm font-medium text-white">{stage.name}</span>
      </div>
      <p className="text-xs text-slate-400 mb-2">{leads.length} leadów</p>
      <div className={`h-24 w-full rounded-lg ${stage.color} opacity-30`} style={{ opacity: 0.1 + (leads.length / 10) * 0.3 }}></div>
      <p className="text-sm text-emerald-400 mt-2">{totalValue.toLocaleString()} PLN</p>
    </div>
  );
}

function StatusBadge({ status, small }) {
  const styles = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    qualified: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    offer_sent: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    negotiation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    won: 'bg-green-500/20 text-green-400 border-green-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    rejected: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const labels = {
    new: 'Nowy',
    contacted: 'Skontaktowano',
    active: 'Aktywny',
    qualified: 'Kwalifikowany',
    offer_sent: 'Oferta wysłana',
    negotiation: 'Negocjacje',
    won: 'Wygrane',
    lost: 'Przegrane',
    rejected: 'Odrzucony',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${styles[status] || styles.new} ${small ? 'text-[10px]' : 'text-xs'} font-medium`}>
      {labels[status] || status}
    </span>
  );
}

function MetricCard({ label, value, change, icon: Icon }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-slate-400" />
        <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function NewLeadModal({ event, onClose, onSave }) {
  const [formData, setFormData] = useState({
    company: event?.organizer || '',
    contact: event?.contact || '',
    eventName: event?.name || '',
    value: 1500,
    notes: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Nowy lead</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Firma/Organizator</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Kontakt</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Wydarzenie</label>
            <input
              type="text"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Szacowana wartość (PLN)</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notatki</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-20"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            Anuluj
          </button>
          <button 
            onClick={() => onSave({ ...formData, status: 'new', offerSent: false })}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}

function OfferModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Generuj ofertę</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Wybierz pakiet</label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              {servicePackages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name} - {pkg.price} PLN</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Dodatkowe usługi</label>
            <div className="space-y-2">
              {additionalServices.map(service => (
                <label key={service.id} className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="rounded bg-slate-700 border-slate-600" />
                  {service.name} (+{service.price} PLN)
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Personalizacja wiadomości</label>
            <textarea 
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-32"
              placeholder="Dodatkowy tekst do oferty..."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            Anuluj
          </button>
          <button className="py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Podgląd
          </button>
          <button className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white flex items-center gap-2">
            <Send className="w-4 h-4" />
            Wyślij ofertę
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== DANE POMOCNICZE ======
const mockEvents = [
  { id: 1, name: 'Runmageddon Warszawa', organizer: 'Runmageddon Sp. z o.o.', contact: 'kontakt@runmageddon.pl', date: '2026-03-15', location: 'Warszawa', category: 'OCR', status: 'new', potential: 5, source: 'runmageddon.pl', discoveredAt: new Date() },
  { id: 2, name: 'HYROX Poznań 2026', organizer: 'HYROX GmbH', contact: 'poland@hyrox.com', date: '2025-12-13', location: 'Poznań', category: 'Fitness', status: 'contacted', potential: 5, source: 'hyrox.com', discoveredAt: new Date() },
  { id: 3, name: 'Maraton Krakowski', organizer: 'Fundacja Cracovia Maraton', contact: 'biuro@cracoviamaraton.pl', date: '2026-04-26', location: 'Kraków', category: 'Bieganie', status: 'new', potential: 4, source: 'kalendarzBiegowy.pl', discoveredAt: new Date() },
  { id: 4, name: 'CrossFit Games Qualifier', organizer: 'CrossFit Wrocław', contact: 'events@crossfitwroclaw.pl', date: '2026-02-20', location: 'Wrocław', category: 'CrossFit', status: 'qualified', potential: 4, source: 'crossfit.com', discoveredAt: new Date(Date.now() - 86400000) },
  { id: 5, name: 'Puchar Polski w Siatkówce', organizer: 'PZPS', contact: 'biuro@pzps.pl', date: '2026-03-08', location: 'Łódź', category: 'Siatkówka', status: 'new', potential: 5, source: 'pzps.pl', discoveredAt: new Date() },
  { id: 6, name: 'Festiwal Open\'er 2026', organizer: 'Alter Art', contact: 'info@opener.pl', date: '2026-07-01', location: 'Gdynia', category: 'Festiwal', status: 'new', potential: 3, source: 'goout.net', discoveredAt: new Date() },
  { id: 7, name: 'Konferencja InfoShare', organizer: 'InfoShare Foundation', contact: 'partners@infoshare.pl', date: '2026-05-20', location: 'Gdańsk', category: 'Konferencja', status: 'contacted', potential: 4, source: '10times.com', discoveredAt: new Date(Date.now() - 172800000) },
  { id: 8, name: 'Targi MOTOR SHOW', organizer: 'MTP Poznań', contact: 'motorshow@mtp.pl', date: '2026-04-10', location: 'Poznań', category: 'Targi', status: 'new', potential: 3, source: 'mtp.pl', discoveredAt: new Date() },
];

const mockLeads = [
  { id: 1, company: 'Runmageddon Sp. z o.o.', contact: 'Jan Kowalski', eventName: 'Runmageddon Warszawa', value: 4500, status: 'active', offerSent: false },
  { id: 2, company: 'HYROX GmbH', contact: 'Anna Nowak', eventName: 'HYROX Poznań', value: 8000, status: 'offer_sent', offerSent: true, offerDate: '2025-12-20', package: 'Premium' },
  { id: 3, company: 'CrossFit Wrocław', contact: 'Piotr Wiśniewski', eventName: 'CrossFit Games Qualifier', value: 2500, status: 'negotiation', offerSent: true, offerDate: '2025-12-18', package: 'Standard' },
  { id: 4, company: 'PZPS', contact: 'Maria Zielińska', eventName: 'Puchar Polski Siatkówka', value: 6000, status: 'qualified', offerSent: false },
  { id: 5, company: 'Alter Art', contact: 'Tomasz Lewandowski', eventName: 'Open\'er Festival', value: 15000, status: 'new', offerSent: false },
  { id: 6, company: 'Stowarzyszenie Biegowe', contact: 'Ewa Kamińska', eventName: 'Bieg Nocny Gdańsk', value: 1800, status: 'won', offerSent: true, offerDate: '2025-12-10', package: 'Basic' },
];

const pipelineStages = [
  { id: 'new', name: 'Nowe', color: 'bg-blue-500' },
  { id: 'active', name: 'Aktywne', color: 'bg-emerald-500' },
  { id: 'offer_sent', name: 'Oferta wysłana', color: 'bg-violet-500' },
  { id: 'negotiation', name: 'Negocjacje', color: 'bg-orange-500' },
  { id: 'won', name: 'Wygrane', color: 'bg-green-500' },
];

const aggregationSources = [
  { id: 1, name: 'Datasport.pl', eventCount: 45, active: true },
  { id: 2, name: 'KalendarzBiegowy.pl', eventCount: 38, active: true },
  { id: 3, name: 'Runmageddon.pl', eventCount: 12, active: true },
  { id: 4, name: 'HYROX.com', eventCount: 6, active: true },
  { id: 5, name: 'MTP.pl', eventCount: 24, active: true },
  { id: 6, name: 'GoOut.net', eventCount: 32, active: true },
  { id: 7, name: '10times.com', eventCount: 18, active: true },
  { id: 8, name: 'PZPN.pl', eventCount: 8, active: false },
];

const servicePackages = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Podstawowy streaming 1-kamerowy',
    price: '990',
    features: ['1 kamera statyczna', 'Do 2h transmisji', 'Streaming YouTube/FB', 'Podstawowe nakładki graficzne'],
    popular: false
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Profesjonalna realizacja multi-cam',
    price: '2490',
    features: ['2-3 kamery', 'Do 4h transmisji', 'Realizator wizji', 'Grafiki i animacje', 'Replay i highlights', 'Backup nagrania'],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Pełna produkcja eventowa',
    price: '4990',
    features: ['4+ kamery z operatorami', 'Cały dzień transmisji', 'Wóz transmisyjny OB', 'LiveU bonding 4G/5G', 'Komentator/prowadzący', 'Post-produkcja highlights'],
    popular: false
  },
];

const additionalServices = [
  { id: 'drone', name: 'Dron z operatorem', price: 800 },
  { id: 'commentator', name: 'Komentator sportowy', price: 600 },
  { id: 'graphics', name: 'Dedykowane grafiki', price: 400 },
  { id: 'highlights', name: 'Montaż highlights', price: 500 },
  { id: 'multistream', name: 'Multi-platform streaming', price: 300 },
];

const eventCategories = [
  { name: 'Bieganie', count: 28, color: 'bg-emerald-500' },
  { name: 'OCR/CrossFit', count: 15, color: 'bg-cyan-500' },
  { name: 'Siatkówka', count: 12, color: 'bg-violet-500' },
  { name: 'Festiwale', count: 18, color: 'bg-amber-500' },
  { name: 'Konferencje', count: 22, color: 'bg-rose-500' },
  { name: 'Targi', count: 14, color: 'bg-orange-500' },
];

const funnelStages = [
  { name: 'Wykryte', count: 156, value: 100 },
  { name: 'Skontaktowane', count: 89, value: 70 },
  { name: 'Kwalifikowane', count: 45, value: 45 },
  { name: 'Oferta wysłana', count: 28, value: 30 },
  { name: 'Wygrane', count: 12, value: 15 },
];

// ====== FUNKCJE POMOCNICZE ======
function isThisWeek(date) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(date) >= weekAgo;
}

function isUpcoming(dateStr, days) {
  const date = new Date(dateStr);
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date >= now && date <= future;
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function generateCalendarDays(month) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);
  const days = [];
  
  // Dni z poprzedniego miesiąca
  const startPadding = (firstDay.getDay() + 6) % 7;
  for (let i = startPadding; i > 0; i--) {
    days.push(new Date(year, m, 1 - i));
  }
  
  // Dni bieżącego miesiąca
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, m, i));
  }
  
  // Dni z następnego miesiąca
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, m + 1, i));
  }
  
  return days;
}

function getCategoryStyle(category) {
  const styles = {
    'OCR': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    'Fitness': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Bieganie': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'CrossFit': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Siatkówka': 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    'Festiwal': 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
    'Konferencja': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'Targi': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };
  return styles[category] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
}

function getCategoryBg(category) {
  const bgs = {
    'OCR': 'bg-cyan-500/20',
    'Fitness': 'bg-emerald-500/20',
    'Bieganie': 'bg-green-500/20',
    'CrossFit': 'bg-orange-500/20',
    'Siatkówka': 'bg-violet-500/20',
    'Festiwal': 'bg-pink-500/20',
    'Konferencja': 'bg-blue-500/20',
    'Targi': 'bg-amber-500/20',
  };
  return bgs[category] || 'bg-slate-500/20';
}

function getCategoryIcon(category) {
  const icons = {
    'OCR': <Target className="w-5 h-5 text-cyan-400" />,
    'Fitness': <Zap className="w-5 h-5 text-emerald-400" />,
    'Bieganie': <TrendingUp className="w-5 h-5 text-green-400" />,
    'CrossFit': <Layers className="w-5 h-5 text-orange-400" />,
    'Siatkówka': <Globe className="w-5 h-5 text-violet-400" />,
    'Festiwal': <Star className="w-5 h-5 text-pink-400" />,
    'Konferencja': <Users className="w-5 h-5 text-blue-400" />,
    'Targi': <Calendar className="w-5 h-5 text-amber-400" />,
  };
  return icons[category] || <Calendar className="w-5 h-5 text-slate-400" />;
}

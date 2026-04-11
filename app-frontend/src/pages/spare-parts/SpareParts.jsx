import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { getParts, getCompatibilityOptions } from '../../services/sparePartsApi';
import { SORT_OPTIONS } from '../../utils/sparePartsUtils';
import SparePartCard from '../../components/spareParts/SparePartCard';
import SparePartDetailModal from '../../components/spareParts/SparePartDetailModal';
import AddEditPartModal from '../../components/spareParts/AddEditPartModal';
import SellPartModal from '../../components/spareParts/SellPartModal';
import RestockPartModal from '../../components/spareParts/RestockPartModal';
import PartsToolbar from '../../components/spareParts/PartsToolbar';
import Pagination from '../../components/spareParts/Pagination';
import PartsGridSkeleton from '../../components/spareParts/PartsGridSkeleton';
import EmptyInventoryState from '../../components/spareParts/EmptyInventoryState';
import ActiveFilterPills from '../../components/spareParts/ActiveFilterPills';

const LIMIT = 20;

const SpareParts = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'manager'].includes(user?.role);

  const [parts, setParts]               = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [searchInput, setSearchInput]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory]         = useState('');
  const [sortBy, setSortBy]             = useState('name');
  const [sortOrder, setSortOrder]       = useState('asc');
  const [isLoading, setIsLoading]       = useState(true);
  const [compatEngine, setCompatEngine]       = useState('');
  const [compatTransmission, setCompatTransmission] = useState('');
  const [engineOptions, setEngineOptions]           = useState([]);
  const [transmissionOptions, setTransmissionOptions] = useState([]);

  const [selectedPart, setSelectedPart] = useState(null);
  const [modal, setModal]               = useState(null);

  const hasActiveFilters = useMemo(
    () => Boolean(debouncedSearch || category || compatEngine || compatTransmission),
    [debouncedSearch, category, compatEngine, compatTransmission],
  );

  const filterPills = useMemo(() => {
    const items = [];
    if (debouncedSearch) {
      items.push({
        key:      'search',
        label:    `Search: "${debouncedSearch}"`,
        onRemove: () => { setSearchInput(''); setDebouncedSearch(''); setPage(1); },
      });
    }
    if (category) {
      items.push({
        key:      'category',
        label:    `Category: ${category}`,
        onRemove: () => { setCategory(''); setPage(1); },
      });
    }
    if (compatEngine) {
      items.push({
        key:      'engine',
        label:    `Engine: ${compatEngine}`,
        onRemove: () => { setCompatEngine(''); setPage(1); },
      });
    }
    if (compatTransmission) {
      items.push({
        key:      'transmission',
        label:    `Transmission: ${compatTransmission}`,
        onRemove: () => { setCompatTransmission(''); setPage(1); },
      });
    }
    return items;
  }, [debouncedSearch, category, compatEngine, compatTransmission]);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategory('');
    setCompatEngine('');
    setCompatTransmission('');
    setPage(1);
  }, []);

  // Debounce search — fires 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: LIMIT, sortBy, sortOrder };
      if (debouncedSearch)  params.search                = debouncedSearch;
      if (category)         params.category              = category;
      if (compatEngine)     params.compatibleEngine      = compatEngine;
      if (compatTransmission) params.compatibleTransmission = compatTransmission;
      const res = await getParts(params);
      setParts(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load parts');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, category, sortBy, sortOrder, compatEngine, compatTransmission]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  useEffect(() => {
    getCompatibilityOptions()
      .then((res) => {
        setEngineOptions(res.data.data.engines);
        setTransmissionOptions(res.data.data.transmissions);
      })
      .catch(() => {});
  }, []);

  const handleSortChange = (e) => {
    const option = SORT_OPTIONS[Number(e.target.value)];
    setSortBy(option.sortBy);
    setSortOrder(option.sortOrder);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(1);
  };

  const afterMutation = () => {
    fetchParts();
  };

  const openDetail = (part) => { setSelectedPart(part); setModal('detail'); };
  const openModal  = (type)  => setModal(type);
  const closeModal = () => { setModal(null); setSelectedPart(null); };

  const openAddPart = () => { setSelectedPart(null); openModal('add'); };

  const totalPages = Math.ceil(total / LIMIT);

  const selectedSortIndex = SORT_OPTIONS.findIndex(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder
  );

  const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd     = Math.min(page * LIMIT, total);

  return (
    <section className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">Spare Parts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading
              ? 'Loading inventory…'
              : total > 0
                ? `${total} part${total !== 1 ? 's' : ''} in inventory`
                : hasActiveFilters
                  ? 'No matches for your filters'
                  : 'No parts in inventory'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openAddPart}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-dark/50 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0b]"
          >
            <span className="text-base leading-none">+</span> Add Part
          </button>
        )}
      </div>

      <div className="sticky top-14 sm:top-16 z-40 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 mb-4 bg-white/95 dark:bg-[#0a0a0b]/95 backdrop-blur-md border-b border-gray-200/60 dark:border-white/5 shadow-sm">
        <PartsToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={handleClearSearch}
          category={category}
          onCategoryChange={handleCategoryChange}
          selectedSortIndex={selectedSortIndex}
          onSortChange={handleSortChange}
          compatEngine={compatEngine}
          compatTransmission={compatTransmission}
          onCompatEngineChange={(e) => { setCompatEngine(e.target.value); setPage(1); }}
          onCompatTransmissionChange={(e) => { setCompatTransmission(e.target.value); setPage(1); }}
          onClearCompatFilters={() => { setCompatEngine(''); setCompatTransmission(''); setPage(1); }}
          engineOptions={engineOptions}
          transmissionOptions={transmissionOptions}
        />
        <ActiveFilterPills pills={filterPills} onClearAll={clearAllFilters} />
      </div>

      {!isLoading && total > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Showing <span className="font-medium text-gray-700 dark:text-gray-300">{rangeStart}</span>
          {'–'}
          <span className="font-medium text-gray-700 dark:text-gray-300">{rangeEnd}</span>
          {' of '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
        </p>
      )}

      {isLoading ? (
        <PartsGridSkeleton />
      ) : parts.length === 0 ? (
        hasActiveFilters ? (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500">
            <p className="text-lg font-medium">No parts found</p>
            <p className="text-sm mt-1">Try a different search or clear the filters</p>
          </div>
        ) : canManage ? (
          <EmptyInventoryState onAddPart={openAddPart} />
        ) : (
          <div className="text-center py-24 text-gray-400 dark:text-gray-500">
            <p className="text-lg font-medium">No parts in inventory</p>
            <p className="text-sm mt-1">Check back later or contact a manager</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {parts.map((part) => (
            <SparePartCard key={part._id} part={part} onClick={() => openDetail(part)} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <SparePartDetailModal
        isOpen={modal === 'detail'}
        onClose={closeModal}
        part={selectedPart}
        canManage={canManage}
        onEdit={() => openModal('edit')}
        onSell={() => openModal('sell')}
        onRestock={() => openModal('restock')}
        onDeleted={afterMutation}
      />
      <AddEditPartModal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={closeModal}
        onSaved={afterMutation}
        part={modal === 'edit' ? selectedPart : null}
      />
      <SellPartModal
        isOpen={modal === 'sell'}
        onClose={closeModal}
        onSaved={afterMutation}
        part={selectedPart}
      />
      <RestockPartModal
        isOpen={modal === 'restock'}
        onClose={closeModal}
        onSaved={afterMutation}
        part={selectedPart}
      />
    </section>
  );
};

export default SpareParts;

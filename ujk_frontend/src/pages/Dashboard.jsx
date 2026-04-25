import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    // DATA STATES
    const [stationery, setStationery] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // State baru untuk Supplier
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // SIDEBAR STATE
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // POPUP STATE
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('');
    const [editingId, setEditingId] = useState(null); 
    const [loading, setLoading] = useState(false);

    // FORM STATES - STATIONERY
    const [newName, setNewName] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [newStock, setNewStock] = useState(''); 
    const [addStockQuantity, setAddStockQuantity] = useState('');

    // FORM STATES - SUPPLIER
    const [supplierName, setSupplierName] = useState('');
    const [supplierContact, setSupplierContact] = useState('');
    const [supplierAddress, setSupplierAddress] = useState('');

    // SEARCH AND PAGINATION STATE
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const loginUser = localStorage.getItem('user');
        if (!loginUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(loginUser));
        fetchStationery();
        fetchSuppliers(); // Fetch data supplier saat load
    }, [navigate]);

    // Reset pagination & search saat pindah tab
    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
    }, [activeTab]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // FETCH DATA
    const fetchStationery = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/stationery');
            if (response.data && response.data.data) {
                setStationery(response.data.data);
            } else {
                setStationery([]);
            }
        } catch (error) {
            console.error("Failed to get stationery data:", error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/suppliers');
            if (response.data && response.data.data) {
                setSuppliers(response.data.data);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            console.error("Failed to get supplier data:", error);
        }
    };

    // DASHBOARD LOGIC
    const totalItems = stationery.length;
    const totalCategories = new Set(stationery.map(item => item.class_name)).size;
    const totalStock = stationery.reduce((sum, item) => sum + parseInt(item.stock || 0), 0);
    const lowStockItems = stationery.filter(item => parseInt(item.stock) <= 10);
    const totalSuppliers = suppliers.length;

    // OPEN POPUP ADD
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    // OPEN POPUP RESTOCK 
    const handleOpenRestockModal = (item) => {
        setEditingId(item.id);
        setNewName(item.name);          
        setNewClassName(item.class_name); 
        setNewStock(item.stock); 
        setAddStockQuantity(''); 
        setModalMode('restock'); 
        setIsModalOpen(true);
    };

    // EDIT LOGIC
    const handleEditClick = (item) => {
        setEditingId(item.id);          
        setModalMode('');

        if (activeTab === 'inventory') {
            setNewName(item.name);          
            setNewClassName(item.class_name); 
            setNewStock(item.stock); 
        } else if (activeTab === 'suppliers') {
            setSupplierName(item.name);
            setSupplierContact(item.contact);
            setSupplierAddress(item.address);
        }
        setIsModalOpen(true); 
    };

    // CLOSE POPUP LOGIC
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setModalMode('');       
        
        // Clear Stationery form
        setNewName('');
        setNewClassName('');
        setNewStock('');
        setAddStockQuantity(''); 
        
        // Clear Supplier form
        setSupplierName('');
        setSupplierContact('');
        setSupplierAddress('');
    };

    // SUBMIT LOGIC 
const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // LOGIC RESTOCK 
            if (modalMode === 'restock') {
                const finalStock = parseInt(newStock) + parseInt(addStockQuantity);
                
                await axios.put(`http://localhost:5000/api/stationery/${editingId}`, {
                    name: newName, 
                    class_name: newClassName, 
                    stock: finalStock
                });
                fetchStationery(); // Update data di tabel

            // LOGIC MASTER DATA 
            } else if (activeTab === 'inventory') {
                if (!newName || !newClassName || newStock === '') return;

                if (editingId) {
                    await axios.put(`http://localhost:5000/api/stationery/${editingId}`, {
                        name: newName, class_name: newClassName, stock: newStock
                    });
                } else {
                    await axios.post('http://localhost:5000/api/stationery', {
                        users_id: user.user_id, name: newName, class_name: newClassName, stock: newStock
                    });
                }
                fetchStationery(); 

            // 3. LOGIC DATA SUPPLIER
            } else if (activeTab === 'suppliers') {
                if (!supplierName || !supplierContact || !supplierAddress) return;

                if (editingId) {
                    await axios.put(`http://localhost:5000/api/suppliers/${editingId}`, {
                        name: supplierName, contact: supplierContact, address: supplierAddress
                    });
                } else {
                    await axios.post('http://localhost:5000/api/suppliers', {
                        name: supplierName, contact: supplierContact, address: supplierAddress
                    });
                }
                fetchSuppliers();
            }
            
            handleCloseModal();
        } catch (error) {
            console.error("Submit error:", error);
            alert("Failed to save data.");
        } finally {
            setLoading(false);
        }
    };

    // DELETE LOGIC 
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            if (activeTab === 'inventory') {
                await axios.delete(`http://localhost:5000/api/stationery/${id}`);
                fetchStationery();
            } else if (activeTab === 'suppliers') {
                await axios.delete(`http://localhost:5000/api/suppliers/${id}`);
                fetchSuppliers();
            }
            if (editingId === id) handleCloseModal();
        } catch (error) {
            alert("Failed to delete data.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    // DYNAMIC FILTER & PAGINATION
    const currentDataList = activeTab === 'inventory' ? stationery : suppliers;
    
    const filteredData = currentDataList.filter(item => {
        if (activeTab === 'inventory') {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   item.class_name.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   item.contact.toLowerCase().includes(searchTerm.toLowerCase());
        }
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    return (
        <div className="dashboard-layout">
            
            {/* SIDEBAR COMPONENT */}
            <aside className={`sidebar-base ${isSidebarOpen ? 'w-64' : 'w-0 md:w-16'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">S</div>
                    <span className={`ml-3 font-bold text-lg text-blue-400 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Stationery</span>
                </div>

                <nav className="sidebar-nav">
                    <button onClick={() => setActiveTab('dashboard')} className={`sidebar-menu-btn ${activeTab === 'dashboard' ? 'sidebar-menu-active' : 'sidebar-menu-inactive'}`}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span className={`ml-3 font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Dashboard</span>
                    </button>
                    <button onClick={() => setActiveTab('inventory')} className={`sidebar-menu-btn ${activeTab === 'inventory' ? 'sidebar-menu-active' : 'sidebar-menu-inactive'}`}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        <span className={`ml-3 font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Master Data</span>
                    </button>
                    {/* MENU SUPPLIER BARU */}
                    <button onClick={() => setActiveTab('suppliers')} className={`sidebar-menu-btn ${activeTab === 'suppliers' ? 'sidebar-menu-active' : 'sidebar-menu-inactive'}`}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span className={`ml-3 font-medium transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>Data Supplier</span>
                    </button>
                </nav>

                <div className="sidebar-profile">
                    <div className="flex items-center">
                        <div className="sidebar-avatar">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                            <p className="text-sm font-medium text-white leading-none">{user?.username}</p>
                            <p className="text-xs text-slate-400 mt-1">Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* CONTENT */}
            <div className="main-wrapper">
                
                <header className="topbar">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="btn-toggle-sidebar">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
                    </button>
                    <button onClick={handleLogout} className="btn-logout">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span className="hidden sm:inline">Log Out</span>
                    </button>
                </header>

                <main className="content-area">
                    <div className="content-container">
                        
                        {/* DASHBOARD */}
                        {activeTab === 'dashboard' && (
                            <div className="animate-fade-in">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                                    <p className="text-slate-400 text-sm mt-1">Summary of the current inventory status.</p>
                                </div>

                                <div className="stat-card-container">
                                    <div className="stat-card">
                                        <div className="icon-box-blue">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium">Total Items</p>
                                            <p className="text-3xl font-bold text-white">{totalItems}</p>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="icon-box-purple">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium">Total Category</p>
                                            <p className="text-3xl font-bold text-white">{totalCategories}</p>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="icon-box-green">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium">Total Suppliers</p>
                                            <p className="text-3xl font-bold text-white">{totalSuppliers}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="warning-card mt-8">
                                    <div className="warning-header">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <h2 className="text-lg font-bold text-red-400">Warning: Stock Running Low (≤ 10 Pcs)</h2>
                                    </div>
                                    
                                    {lowStockItems.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 italic flex flex-col items-center">
                                            All good! No items need to be restocked.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table-base">
                                                <thead className="table-head">
                                                    <tr>
                                                        <th className="px-6 py-4">Items Name</th>
                                                        <th className="px-6 py-4">Category</th>
                                                        <th className="px-6 py-4 text-center">Remaining Stock</th>
                                                        <th className="px-6 py-4 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {lowStockItems.map((item) => (
                                                        <tr key={item.id} className="table-row">
                                                            <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                                                            <td className="px-6 py-4"><span className="text-slate-400">{item.class_name}</span></td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="badge-danger">
                                                                    {item.stock} Pcs
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button onClick={() => handleOpenRestockModal(item)} className="btn-outline-blue">
                                                                    Add Stock
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* MASTER DATA (STATIONERY) & DATA SUPPLIER */}
                        {(activeTab === 'inventory' || activeTab === 'suppliers') && (
                            <div className="animate-fade-in">
                                <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">
                                            {activeTab === 'inventory' ? 'Master Data' : 'Data Supplier'}
                                        </h1>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {activeTab === 'inventory' ? 'Monitor the availability of stationery' : 'Manage your stationery suppliers'}
                                        </p>
                                    </div>
                                    
                                    {/* OPEN POPUP */}
                                    <button onClick={handleOpenModal} className="btn-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        {activeTab === 'inventory' ? 'Add Items' : 'Add Supplier'}
                                    </button>
                                </div>

                                {/* TABLE LIST */}
                                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                                    <div className="search-container">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            {activeTab === 'inventory' ? 'Data Inventory' : 'Supplier List'}
                                        </h2>
                                        <div className="relative w-full sm:w-64">
                                            <input 
                                                type="text" 
                                                placeholder={activeTab === 'inventory' ? "Search by name or category..." : "Search by name or contact..."}
                                                className="search-input" 
                                                value={searchTerm} 
                                                onChange={(e) => setSearchTerm(e.target.value)} 
                                            />
                                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </div>
                                    </div>
                                    
                                    {currentItems.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400 italic">Data not found.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="table-base">
                                                <thead className="table-head bg-slate-900">
                                                    <tr>
                                                        <th className="px-6 py-4 w-16 text-center">No</th>
                                                        <th className="px-6 py-4">{activeTab === 'inventory' ? 'Items Name' : 'Supplier Name'}</th>
                                                        <th className="px-6 py-4">{activeTab === 'inventory' ? 'Category' : 'Contact Number'}</th>
                                                        <th className="px-6 py-4 text-center">{activeTab === 'inventory' ? 'Stock' : 'Address'}</th>
                                                        <th className="px-6 py-4 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentItems.map((item, index) => (
                                                        <tr key={item.id} className="table-row">
                                                            <td className="px-6 py-4 text-center">{indexOfFirstItem + index + 1}</td>
                                                            <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                                                                                                                        {activeTab === 'inventory' ? (
                                                                <>
                                                                    <td className="px-6 py-4"><span className="badge-category">{item.class_name}</span></td>
                                                                    <td className="px-6 py-4 text-center">
                                                                        <span className={item.stock > 10 ? 'badge-success' : 'badge-danger'}>
                                                                            {item.stock}
                                                                        </span>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="px-6 py-4 text-slate-300">{item.contact}</td>
                                                                    <td className="px-6 py-4 text-center text-slate-400">{item.address}</td>
                                                                </>
                                                            )}

                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    <button onClick={() => handleEditClick(item)} className="btn-outline-yellow">Edit</button>
                                                                    <button onClick={() => handleDelete(item.id, item.name)} className="btn-outline-red">Delete</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {totalPages > 1 && (
                                        <div className="pagination-bar">
                                            <span className="text-sm text-slate-400">Pages <span className="font-semibold text-white">{currentPage}</span> of {totalPages}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn-pagination">Prev</button>
                                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn-pagination">Next</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </main>

                {/* MODAL / POPUP */}
                {isModalOpen && (
                    <div className="animate-fade-in modal-overlay">
                        <div className={`modal-base ${modalMode === 'restock' ? 'border-green-600/50' : (editingId ? 'border-yellow-600/50' : 'border-blue-600/50')}`}>
                            
                            <div className={`modal-header ${modalMode === 'restock' ? 'bg-green-900/20 border-green-700/30' : (editingId ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-slate-800 border-slate-700')}`}>
                                <h2 className={`text-xl font-bold flex items-center gap-2 ${modalMode === 'restock' ? 'text-green-400' : (editingId ? 'text-yellow-400' : 'text-blue-400')}`}>
                                    {modalMode === 'restock' ? '📦 Restock Item' : (editingId ? '✏️ Edit Data' : '➕ Add Data')}
                                </h2>

                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors focus:outline-none">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                        <form onSubmit={handleSubmit} className="form-wrapper">
                                
                                {/* Restock */}
                                {modalMode === 'restock' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Items Name</label>
                                            <input type="text" value={newName} disabled className="input-disabled" />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-400 mb-1">Current Stock</label>
                                                <input type="text" value={`${newStock} Pcs`} disabled className="input-disabled text-center" />
                                            </div>
                                            <div className="flex-[2]">
                                                <label className="block text-sm font-medium text-green-400 mb-1">Add Quantity</label>
                                                <input type="number" placeholder="e.g. 50" min="1" className="input-success" value={addStockQuantity} onChange={(e) => setAddStockQuantity(e.target.value)} required autoFocus />
                                            </div>
                                        </div>
                                    </>

                                // FORM UNTUK INVENTORY
                                ) : activeTab === 'inventory' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Items Name</label>
                                            <input type="text" placeholder="Example: HVS Paper A4" className="input-default" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-[2]">
                                                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                                <input type="text" placeholder="Example: Paper / Ink" className="input-default" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} required />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-400 mb-1">Stock</label>
                                                <input type="number" placeholder="0" min="0" className="input-default" value={newStock} onChange={(e) => setNewStock(e.target.value)} required />
                                            </div>
                                        </div>
                                    </>

                                // FORM UNTUK SUPPLIER (
                                ) : activeTab === 'suppliers' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Supplier Name</label>
                                            <input type="text" placeholder="PT Vania Maju Bersama" className="input-default" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Contact Number</label>
                                            <input type="text" placeholder="081234567890" className="input-default" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Address</label>
                                            <textarea placeholder="Jalan Slamet Riyadi No. 12, Surakarta" className="input-default resize-none" rows="3" value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} required></textarea>
                                        </div>
                                    </>
                                ) : null}

                                <div className="modal-actions">
                                    <button type="button" onClick={handleCloseModal} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} className={`btn-submit-base ${modalMode === 'restock' ? 'bg-green-600 hover:bg-green-500 hover:shadow-green-600/30' : (editingId ? 'bg-yellow-600 hover:bg-yellow-500 hover:shadow-yellow-600/30' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-600/30')}`}>
                                        {loading ? 'Saving...' : (modalMode === 'restock' ? 'Update Stock' : (editingId ? 'Update Data' : 'Save Data'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
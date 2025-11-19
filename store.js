import { supabase } from './supabase-client.js';
import { state } from './state.js';
import { els, getPlaceholderImage, formatDate } from './utils.js';
import { refreshUserData } from './app.js';

const getProduct = (productId) => state.products.find(p => p.id === productId);

export const loadStoreAndProductData = async () => {
    try {
        // Fetches features and specs from their specific tables
        const { data, error } = await supabase.from('products').select(`
                id, name, description, original_price, discounted_price, ecopoints_cost, store_id, metadata,
                stores ( name, logo_url ), 
                product_images ( image_url, sort_order ),
                product_features ( feature, sort_order ),
                product_specifications ( spec_key, spec_value, sort_order )
            `).eq('is_active', true);
        if (error) return;

        state.products = data.map(p => ({
            ...p, 
            images: p.product_images?.sort((a,b) => a.sort_order - b.sort_order).map(img => img.image_url) || [],
            highlights: p.product_features?.sort((a,b) => a.sort_order - b.sort_order).map(f => f.feature) || [],
            specs: p.product_specifications?.sort((a,b) => a.sort_order - b.sort_order) || [],
            
            storeName: p.stores?.name || 'Unknown Store', 
            storeLogo: p.stores?.logo_url, 
            popularity: Math.floor(Math.random() * 50) 
        }));
        if (document.getElementById('rewards').classList.contains('active')) renderRewards();
    } catch (err) { console.error('Product Load Error:', err); }
};

export const renderRewards = () => {
    els.productGrid.innerHTML = '';
    let products = [...state.products];
    if (products.length === 0) { els.productGrid.innerHTML = `<p class="text-sm text-center text-gray-500 col-span-2">Loading rewards...</p>`; return; }
    
    const searchTerm = els.storeSearch.value.toLowerCase();
    if(searchTerm.length > 0) products = products.filter(p => p.name.toLowerCase().includes(searchTerm) || p.storeName.toLowerCase().includes(searchTerm));
    els.storeSearchClear.classList.toggle('hidden', !searchTerm);

    const criteria = els.sortBy.value;
    products.sort((a, b) => {
        switch (criteria) {
            case 'points-lh': return a.ecopoints_cost - b.ecopoints_cost;
            case 'points-hl': return b.ecopoints_cost - a.ecopoints_cost;
            case 'price-lh': return a.discounted_price - b.discounted_price;
            case 'price-hl': return b.discounted_price - a.discounted_price;
            default: return b.popularity - a.popularity;
        }
    });

    products.forEach(p => {
        const imageUrl = (p.images && p.images[0]) ? p.images[0] : getPlaceholderImage('300x225');
        els.productGrid.innerHTML += `
            <div class="w-full flex-shrink-0 glass-card border border-gray-200/60 dark:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform" onclick="showProductDetailPage('${p.id}')">
                <img src="${imageUrl}" class="w-full h-40 object-cover" onerror="this.src='${getPlaceholderImage('300x225')}'"><div class="p-3 flex flex-col flex-grow"><div class="flex items-center mb-1"><img src="${p.storeLogo || getPlaceholderImage('40x40')}" class="w-5 h-5 rounded-full mr-2 border dark:border-gray-600"><p class="text-xs font-medium text-gray-600 dark:text-gray-400">${p.storeName}</p></div><p class="font-bold text-gray-800 dark:text-gray-100 text-sm truncate mt-1">${p.name}</p><div class="mt-auto pt-2"><p class="text-xs text-gray-400 dark:text-gray-500 line-through">₹${p.original_price}</p><div class="flex items-center font-bold text-gray-800 dark:text-gray-100 my-1"><span class="text-md text-green-700 dark:text-green-400">₹${p.discounted_price}</span><span class="mx-1 text-gray-400 dark:text-gray-500 text-xs">+</span><i data-lucide="leaf" class="w-3 h-3 text-green-500 mr-1"></i><span class="text-sm text-green-700 dark:text-green-400">${p.ecopoints_cost}</span></div></div></div>
            </div>`;
    });
    if(window.lucide) window.lucide.createIcons();
};

// ENHANCED PRODUCT DETAIL PAGE UI
export const showProductDetailPage = (productId) => {
    const product = getProduct(productId);
    if (!product) return;

    const images = (product.images && product.images.length > 0) ? product.images : [getPlaceholderImage()];
    const canAfford = state.currentUser.current_points >= product.ecopoints_cost;
    
    const specs = product.specs.length > 0 ? product.specs : [{ spec_key: 'Info', spec_value: 'Standard Item' }];
    const highlights = product.highlights.length > 0 ? product.highlights : ['Quality Verified'];

    // Slider HTML
    let sliderImagesHTML = '';
    let sliderDotsHTML = '';
    images.forEach((img, index) => {
        sliderImagesHTML += `<img src="${img}" class="slider-item w-full h-80 object-cover flex-shrink-0" data-index="${index}" onerror="this.src='${getPlaceholderImage('600x400')}'">`;
        sliderDotsHTML += `<button class="slider-dot w-2 h-2 rounded-full bg-white/50 transition-all ${index === 0 ? 'bg-white w-4' : ''}"></button>`;
    });

    // Render Enhanced UI
    els.productDetailPage.innerHTML = `
        <div class="bg-white dark:bg-gray-900 min-h-screen relative pb-32">
            <div class="relative">
                <div class="slider-container flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                    ${sliderImagesHTML}
                </div>
                <button onclick="showPage('rewards')" class="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors z-10">
                    <i data-lucide="arrow-left" class="w-6 h-6"></i>
                </button>
                <div class="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-2 z-10">
                    ${sliderDotsHTML}
                </div>
            </div>

            <div class="px-5 py-8 -mt-6 relative bg-white dark:bg-gray-900 rounded-t-[32px] z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                
                <div class="flex justify-between items-start mb-3">
                    <h1 class="text-2xl font-black text-gray-900 dark:text-white w-3/4 leading-snug">${product.name}</h1>
                    <div class="flex-shrink-0 flex items-center bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                        <i data-lucide="leaf" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5"></i>
                        <span class="text-sm font-bold text-emerald-700 dark:text-emerald-300">${product.ecopoints_cost}</span>
                    </div>
                </div>

                <div class="flex items-center mb-8">
                    <img src="${product.storeLogo || getPlaceholderImage('40x40')}" class="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 mr-3 object-cover shadow-sm">
                    <div>
                        <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide">Sold By</p>
                        <p class="text-sm font-bold text-gray-700 dark:text-gray-300">${product.storeName}</p>
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        Description
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        ${product.description || 'No description available for this item.'}
                    </p>
                </div>

                <div class="mb-8">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-4">Highlights</h3>
                    <div class="space-y-3">
                        ${highlights.map(h => `
                            <div class="flex items-start p-3 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50">
                                <div class="flex-shrink-0 mt-0.5 p-1 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                                    <i data-lucide="check" class="w-3 h-3 text-emerald-600 dark:text-emerald-300"></i>
                                </div>
                                <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">${h}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-4">Specifications</h3>
                    <div class="grid grid-cols-2 gap-3">
                        ${specs.map(s => `
                            <div class="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">${s.spec_key}</p>
                                <p class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">${s.spec_value}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mb-4 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="qr-code" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                        <h3 class="text-sm font-bold text-indigo-900 dark:text-indigo-100">How to Redeem</h3>
                    </div>
                    <p class="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        Purchase this item using points. A QR code will be generated which you must show at the <strong>${product.storeName}</strong> counter to claim your item.
                    </p>
                </div>
            </div>

            <div class="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 z-50 shadow-[0_-5px_30px_rgba(0,0,0,0.08)] flex items-center justify-between pb-6">
                <div>
                    <p class="text-xs text-gray-400 line-through mb-0.5">₹${product.original_price}</p>
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-2xl font-black text-gray-900 dark:text-white">₹${product.discounted_price}</span>
                        <span class="text-sm font-medium text-gray-400">+</span>
                        <div class="flex items-center text-emerald-600 font-bold text-lg">
                            <i data-lucide="leaf" class="w-4 h-4 mr-1 fill-current"></i>
                            <span>${product.ecopoints_cost}</span>
                        </div>
                    </div>
                </div>
                
                <button onclick="openPurchaseModal('${product.id}')" 
                    class="bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-bold py-3.5 px-6 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    ${canAfford ? '' : 'disabled'}>
                    ${canAfford ? 'Redeem Now' : 'Low Points'}
                    <i data-lucide="chevron-right" class="w-5 h-5 ml-1"></i>
                </button>
            </div>
        </div>`;

    els.pages.forEach(p => p.classList.remove('active'));
    els.productDetailPage.classList.add('active');
    document.querySelector('.main-content').scrollTop = 0;
    if(window.lucide) window.lucide.createIcons();
};

export const openPurchaseModal = (productId) => {
    const product = getProduct(productId);
    if (!product) return;
    const imageUrl = (product.images && product.images[0]) ? product.images[0] : getPlaceholderImage('100x100');
    els.purchaseModal.innerHTML = `
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">Confirm Redemption</h3><button onclick="closePurchaseModal()" class="text-gray-400"><i data-lucide="x" class="w-6 h-6"></i></button></div><div class="flex items-center mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl"><img src="${imageUrl}" class="w-16 h-16 object-cover rounded-lg mr-4"><div><h4 class="text-lg font-bold text-gray-800 dark:text-gray-100 line-clamp-1">${product.name}</h4><div class="flex items-center font-bold text-gray-800 dark:text-gray-100 text-sm"><span class="text-green-700 dark:text-green-400">₹${product.discounted_price}</span><span class="mx-1 text-gray-400">+</span><i data-lucide="leaf" class="w-3 h-3 text-green-500 mr-1"></i><span class="text-green-700 dark:text-green-400">${product.ecopoints_cost}</span></div></div></div><p class="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">By confirming, ${product.ecopoints_cost} EcoPoints will be deducted from your balance.</p><button id="confirm-purchase-btn" onclick="confirmPurchase('${product.id}')" class="w-full btn-eco-gradient text-white font-bold py-3.5 px-4 rounded-xl mb-3 shadow-lg">Confirm & Pay ₹${product.discounted_price}</button>`;
    els.purchaseModalOverlay.classList.remove('hidden');
    setTimeout(() => els.purchaseModal.classList.remove('translate-y-full'), 10);
    if(window.lucide) window.lucide.createIcons();
};

export const closePurchaseModal = () => {
    els.purchaseModal.classList.add('translate-y-full');
    setTimeout(() => els.purchaseModalOverlay.classList.add('hidden'), 300);
};

export const confirmPurchase = async (productId) => {
    try {
        const product = getProduct(productId);
        if (!product || state.currentUser.current_points < product.ecopoints_cost) { alert("You do not have enough points."); return; }
        const confirmBtn = document.getElementById('confirm-purchase-btn');
        confirmBtn.disabled = true; confirmBtn.textContent = 'Processing...';
        
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({ user_id: state.currentUser.id, store_id: product.store_id, status: 'pending', total_points: product.ecopoints_cost, total_price: product.discounted_price, requires_approval: false }).select().single();
        if (orderError) throw orderError;
        
        const { error: itemError } = await supabase.from('order_items').insert({ order_id: orderData.id, product_id: product.id, quantity: 1, price_each: product.discounted_price, points_each: product.ecopoints_cost });
        if (itemError) throw itemError;
        
        const { error: confirmError } = await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderData.id);
        if (confirmError) throw confirmError;
        
        closePurchaseModal();
        await Promise.all([refreshUserData(), loadUserRewardsData()]);
        window.showPage('my-rewards');
    } catch (err) { console.error('Purchase Failed:', err); alert(`Purchase failed: ${err.message}`); }
};

export const loadUserRewardsData = async () => {
    try {
        const { data, error } = await supabase.from('orders').select(`id, created_at, status, order_items ( products ( id, name, product_images ( image_url ), stores ( name ) ) )`).eq('user_id', state.currentUser.id).order('created_at', { ascending: false });
        if (error) return;
        state.userRewards = data.map(order => {
            const item = order.order_items[0]; if (!item) return null;
            return { userRewardId: order.id, purchaseDate: formatDate(order.created_at), status: order.status, productName: item.products.name, storeName: item.products.stores.name, productImage: (item.products.product_images[0] && item.products.product_images[0].image_url) || getPlaceholderImage() };
        }).filter(Boolean);
        if (document.getElementById('my-rewards').classList.contains('active')) renderMyRewardsPage();
    } catch (err) { console.error('User Rewards Load Error:', err); }
};

export const renderMyRewardsPage = () => {
    els.allRewardsList.innerHTML = '';
    if (state.userRewards.length === 0) { els.allRewardsList.innerHTML = `<p class="text-sm text-center text-gray-500">You haven't purchased any rewards yet.</p>`; return; }
    state.userRewards.forEach(ur => {
        els.allRewardsList.innerHTML += `
            <div class="glass-card p-4 rounded-2xl flex items-center justify-between"><div class="flex items-center"><img src="${ur.productImage}" class="w-14 h-14 rounded-lg object-cover mr-3"><div class="p-1"><p class="text-sm font-bold text-gray-900 dark:text-gray-100">${ur.productName}</p><p class="text-xs text-gray-500 dark:text-gray-400">From ${ur.storeName}</p><p class="text-xs text-gray-400 mt-1">${ur.purchaseDate}</p></div></div>${ur.status === 'confirmed' ? `<button onclick="openRewardQrModal('${ur.userRewardId}')" class="text-xs font-semibold px-3 py-2 rounded-full bg-emerald-600 text-white">View QR</button>` : `<span class="text-xs font-semibold px-3 py-2 rounded-full bg-gray-200 text-gray-600">${ur.status}</span>`}</div>`;
    });
};

export const openRewardQrModal = (userRewardId) => {
    const ur = state.userRewards.find(r => r.userRewardId === userRewardId);
    if (!ur) return;
    const qrValue = `ecocampus-order:${userRewardId}-user:${state.currentUser.id}`;
    els.qrModal.innerHTML = `
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">Reward QR</h3><button onclick="closeQrModal()" class="text-gray-400"><i data-lucide="x" class="w-6 h-6"></i></button></div><p class="text-sm text-gray-600 dark:text-gray-300 mb-4">Show this QR at <strong>${ur.storeName}</strong> to redeem <strong>${ur.productName}</strong>.</p><div class="flex justify-center mb-4"><img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}" class="rounded-lg border"></div><button onclick="closeQrModal()" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg">Close</button>`;
    els.qrModalOverlay.classList.remove('hidden');
    setTimeout(() => els.qrModal.classList.remove('translate-y-full'), 10);
    if(window.lucide) window.lucide.createIcons();
};

export const closeQrModal = () => {
    els.qrModal.classList.add('translate-y-full');
    setTimeout(() => els.qrModalOverlay.classList.add('hidden'), 300);
};

export const renderEcoPointsPage = () => {
    const u = state.currentUser;
    if (!u) return;
};

// Assign to Window (Crucial for inline HTML onclick events)
window.renderRewardsWrapper = renderRewards;
window.showProductDetailPage = showProductDetailPage;
window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
window.confirmPurchase = confirmPurchase;
window.renderMyRewardsPageWrapper = renderMyRewardsPage;
window.openRewardQrModal = openRewardQrModal;
window.closeQrModal = closeQrModal;
window.renderEcoPointsPageWrapper = renderEcoPointsPage;

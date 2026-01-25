async function loadVendorAnalytics() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        // 1. Fetch Analytics Data
        const res = await fetch(`/api/vendor/analytics?vendor_id=${user.id}`);
        const data = await res.json();

        // 2. Fetch Dashboard Stats (for Sales Count)
        const dashRes = await fetch(`/api/vendor/dashboard?user_id=${user.id}`);
        const dashData = await dashRes.json();
        const salesCount = dashData.salesCount || 0;

        // Update Stats
        const profileViews = data.profile_views || 0;
        const productViews = data.product_views || 0;
        const clicks = data.clicks || 0;
        
        document.getElementById('analytics-profile-views').textContent = profileViews;
        document.getElementById('analytics-product-views').textContent = productViews;
        document.getElementById('analytics-clicks').textContent = clicks;

        // Calculate Conversion Rate: (Sales / Product Views) * 100
        // We use product views as the denominator because that's the "opportunity" to sell.
        // Avoid division by zero.
        let conversionRate = 0;
        if (productViews > 0) {
            conversionRate = (salesCount / productViews) * 100;
        }
        document.getElementById('analytics-conversion').textContent = conversionRate.toFixed(1) + '%';

        // Update Table
        const tbody = document.getElementById('analytics-table-body');
        if (data.recent_activity && data.recent_activity.length > 0) {
            tbody.innerHTML = data.recent_activity.map(item => `
                <tr>
                    <td>${new Date(item.created_at).toLocaleString()}</td>
                    <td>
                        <span class="badge bg-${item.event_type === 'profile_view' ? 'primary' : (item.event_type === 'product_view' ? 'success' : 'warning')}">
                            ${item.event_type.replace('_', ' ')}
                        </span>
                    </td>
                    <td>${item.product_name || '-'}</td>
                    <td>${item.ip_address || 'Anonymous'}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No recent activity found.</td></tr>';
        }

    } catch (err) {
        console.error('Analytics error:', err);
        // Don't show toast on load to avoid spamming if one request fails silently
        console.log('Failed to load analytics details');
    }
}
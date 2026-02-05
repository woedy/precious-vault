import React, { createContext, useContext, useState, useEffect } from 'react';

export type KYCStatus = 'unverified' | 'pending' | 'verified';

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    kycStatus: KYCStatus;
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    phoneNumber?: string;
    twoFactorEnabled: boolean;
}

export interface PortfolioItem {
    id: string;
    metal: 'gold' | 'silver' | 'platinum';
    form: 'bar' | 'coin' | 'digital';
    weightOz: number;
    quantity: number;
    location: 'vault_zurich' | 'vault_singapore' | 'vault_newyork' | 'delivered';
    serialNumbers?: string[];
    purchaseDate: string;
}

export interface DeliveryRequest {
    id: string;
    items: { portfolioItemId: string; quantity: number }[];
    status: 'processing' | 'shipped' | 'customs' | 'delivered';
    carrier: 'fedex' | 'brinks' | 'malca';
    trackingNumber: string;
    destination: {
        street: string;
        city: string;
        country: string;
    };
    estimatedArrival: string;
    history: { status: string; date: string; description: string }[];
}

interface MockAppContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    walletBalance: number;
    portfolio: PortfolioItem[];
    transactions: any[];
    deliveries: DeliveryRequest[];
    login: (email: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    submitKYC: (data: any) => Promise<void>;
    enable2FA: () => void;
    addTransaction: (txn: any) => void;
    requestDelivery: (req: Omit<DeliveryRequest, 'id' | 'status' | 'trackingNumber' | 'history' | 'estimatedArrival'>) => void;
}

const MockAppContext = createContext<MockAppContextType | undefined>(undefined);

export const MockAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [walletBalance, setWalletBalance] = useState(15420.50); // Initial mock balance
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);

    // Load all state from local storage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('pv_mock_user');
        const storedPortfolio = localStorage.getItem('pv_mock_portfolio');
        const storedTransactions = localStorage.getItem('pv_mock_transactions');
        const storedDeliveries = localStorage.getItem('pv_mock_deliveries');
        const storedBalance = localStorage.getItem('pv_mock_balance');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        if (storedPortfolio) setPortfolio(JSON.parse(storedPortfolio));
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedDeliveries) setDeliveries(JSON.parse(storedDeliveries));
        if (storedBalance) setWalletBalance(parseFloat(storedBalance));
    }, []);

    // Save user
    useEffect(() => {
        if (user) localStorage.setItem('pv_mock_user', JSON.stringify(user));
        else localStorage.removeItem('pv_mock_user');
    }, [user]);

    // Save other state
    useEffect(() => {
        localStorage.setItem('pv_mock_portfolio', JSON.stringify(portfolio));
    }, [portfolio]);

    useEffect(() => {
        localStorage.setItem('pv_mock_transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('pv_mock_deliveries', JSON.stringify(deliveries));
    }, [deliveries]);

    useEffect(() => {
        localStorage.setItem('pv_mock_balance', walletBalance.toString());
    }, [walletBalance]);

    const login = (email: string) => {
        // Mock login just sets a basic user
        const newUser: UserProfile = {
            id: 'usr_' + Math.random().toString(36).substr(2, 9),
            email,
            firstName: '',
            lastName: '',
            kycStatus: 'unverified',
            twoFactorEnabled: false,
        };
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (updates: Partial<UserProfile>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    const submitKYC = async (data: any) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateUser({
            kycStatus: 'verified', // Auto-verify for demo purposes, or can use 'pending'
            address: data.address,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber
        });
    };

    const enable2FA = () => {
        updateUser({ twoFactorEnabled: true });
    };

    const addTransaction = (txn: any) => {
        const newTxn = {
            ...txn,
            id: 'txn_' + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            status: 'completed'
        };
        setTransactions(prev => [newTxn, ...prev]);

        // Update portfolio if it's a buy
        if (txn.type === 'buy') {
            const newItem: PortfolioItem = {
                id: 'itm_' + Math.random().toString(36).substr(2, 9),
                metal: txn.asset.toLowerCase().includes('gold') ? 'gold' :
                    txn.asset.toLowerCase().includes('silver') ? 'silver' : 'platinum',
                form: txn.asset.toLowerCase().includes('bar') ? 'bar' :
                    txn.asset.toLowerCase().includes('coin') ? 'coin' : 'digital',
                weightOz: parseFloat(txn.amount), // simplified parsing
                quantity: 1, // simplified
                location: txn.method === 'vault' ? 'vault_zurich' : 'delivered',
                purchaseDate: new Date().toISOString().split('T')[0]
            };
            setPortfolio(prev => [...prev, newItem]);
        }
    };

    const requestDelivery = (req: Omit<DeliveryRequest, 'id' | 'status' | 'trackingNumber' | 'history' | 'estimatedArrival'>) => {
        const newDelivery: DeliveryRequest = {
            ...req,
            id: 'del_' + Math.random().toString(36).substr(2, 9),
            status: 'processing',
            trackingNumber: 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            history: [
                { status: 'processing', date: new Date().toISOString(), description: 'Delivery request received and processing.' }
            ]
        };

        setDeliveries(prev => [newDelivery, ...prev]);

        // Update portfolio locations to 'in_transit'
        setPortfolio(prev => prev.map(item => {
            if (req.items.some(i => i.portfolioItemId === item.id)) {
                return { ...item, location: 'delivered' }; // Simplified: move straight to delivered/transit
            }
            return item;
        }));
    };

    return (
        <MockAppContext.Provider value={{
            user,
            isAuthenticated,
            walletBalance,
            portfolio,
            transactions,
            deliveries,
            login,
            logout,
            updateUser,
            submitKYC,
            enable2FA,
            addTransaction,
            requestDelivery
        }}>
            {children}
        </MockAppContext.Provider>
    );
};

export const useMockApp = () => {
    const context = useContext(MockAppContext);
    if (context === undefined) {
        throw new Error('useMockApp must be used within a MockAppProvider');
    }
    return context;
};

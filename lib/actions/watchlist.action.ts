'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist, WatchlistItem } from '@/database/models/watchlist.model';
import { findUserByEmail } from '@/lib/actions/user.action';

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const user = await findUserByEmail(email);
        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        await connectToDatabase();
        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export async function getWatchlistItemsByUserId(userId: string): Promise<WatchlistItem[]> {
    if (!userId) return [];

    await connectToDatabase();
    return await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
}

export async function getWatchlistForDashboard(userId: string) {
    const items = await getWatchlistItemsByUserId(userId);
    return items.map((item) => ({
        symbol: item.symbol,
        company: item.company,
        addedAt: item.addedAt?.toISOString() ?? new Date().toISOString(),
    }));
}

export async function isSymbolInWatchlist(userId: string, symbol: string) {
    if (!userId || !symbol) return false;
    await connectToDatabase();
    const upper = normalizeSymbol(symbol);
    const count = await Watchlist.countDocuments({ userId, symbol: upper });
    return count > 0;
}

export async function addToWatchlist({ userId, symbol, company }: { userId: string; symbol: string; company: string }) {
    if (!userId || !symbol) {
        throw new Error('Missing watchlist parameters');
    }
    await connectToDatabase();
    const upper = normalizeSymbol(symbol);
    const name = company?.trim() || upper;

    await Watchlist.findOneAndUpdate(
        { userId, symbol: upper },
        { userId, symbol: upper, company: name, addedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { success: true };
}

export async function removeFromWatchlist({ userId, symbol }: { userId: string; symbol: string }) {
    if (!userId || !symbol) {
        throw new Error('Missing watchlist parameters');
    }
    await connectToDatabase();
    const upper = normalizeSymbol(symbol);
    await Watchlist.findOneAndDelete({ userId, symbol: upper });
    return { success: true };
}
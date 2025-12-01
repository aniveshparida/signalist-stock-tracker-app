import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";
import { searchStocks } from "@/lib/actions/finnhub.action";

type WatchlistSectionProps = {
    items: WatchlistDisplayItem[];
};

const WatchlistSection = async ({ items }: WatchlistSectionProps) => {
    const initialStocks = await searchStocks();
    return (
        <section id="watchlist" className="w-full">
            <div className="watchlist-container bg-gray-800/40 border border-gray-700 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-gray-500">Your Watchlist</p>
                        <h2 className="watchlist-title mt-1">Saved stocks</h2>
                    </div>
                    <SearchCommand 
                        renderAs="text" 
                        label="+ Add more symbols" 
                        initialStocks={initialStocks}
                        className="add-alert"
                    />
                </div>

                {items.length === 0 ? (
                    <div className="watchlist-empty-container bg-gray-900/70 rounded-xl border border-gray-700">
                        <div className="watchlist-empty">
                            <p className="empty-title">No saved stocks yet</p>
                            <p className="empty-description">
                                Use the search dialog or the “Add to Watchlist” buttons on any stock page. Your saved symbols
                                will appear here for quick reference.
                            </p>
                            <SearchCommand 
                                renderAs="text" 
                                label="Search stocks" 
                                initialStocks={initialStocks}
                                className="add-alert"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="watchlist-table overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="table-header-row">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Symbol
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Added
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-900/70 divide-y divide-gray-800">
                                {items.map((item) => (
                                    <tr key={item.symbol} className="table-row">
                                        <td className="px-4 py-3 font-semibold text-gray-100">
                                            <Link href={`/stocks/${item.symbol}`} className="hover:text-yellow-500 transition-colors">
                                                {item.symbol}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">{item.company || item.symbol}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {item.addedAt
                                                ? new Date(item.addedAt).toLocaleDateString("en-US", {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                  })
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

export default WatchlistSection;

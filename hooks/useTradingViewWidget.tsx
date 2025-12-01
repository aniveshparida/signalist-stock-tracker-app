'use client'
import {useEffect,useRef} from "react";

const useTradingViewWidget = (scriptUrl: string,config: Record<string,unknown>,height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    
    useEffect(() => {
        if(!containerRef.current || !scriptUrl) return;
        if(containerRef.current.dataset.loaded === 'true') return;
        
        const container = containerRef.current;
        const configString = JSON.stringify(config);
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Create the widget container div (TradingView expects this structure)
        const widgetDiv = document.createElement("div");
        widgetDiv.className = "tradingview-widget-container__widget";
        widgetDiv.style.width = "100%";
        widgetDiv.style.height = `${height}px`;
        
        // Append widget div to container
        container.appendChild(widgetDiv);

        // Create and configure the script
        // TradingView scripts need to be inside the container, after the widget div
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.type = "text/javascript";
        script.innerHTML = configString;
        
        // Handle script load errors
        script.onerror = () => {
            console.warn('TradingView widget script failed to load:', scriptUrl);
            if(container) {
                container.innerHTML = '<div style="padding: 20px; color: #9095A1; text-align: center;">Failed to load widget. Please refresh the page.</div>';
                delete container.dataset.loaded;
            }
        };
        
        // Append script to container (TradingView expects script after widget div)
        container.appendChild(script);
        container.dataset.loaded = 'true';

        // Cleanup function
        return () => {
            if(container) {
                // Remove all child nodes
                while(container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                delete container.dataset.loaded;
            }
        };
    }, [scriptUrl, JSON.stringify(config), height]);
    
    return containerRef;
}

export default useTradingViewWidget;
import React, { useEffect, useState } from 'react';
import "./WinControls.css";

export default function WinControls() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const checkIfMaximized = async () => {
            const result = await window.electron.isMaximized();
            setIsMaximized(result);
        };

        checkIfMaximized();
    }, []);

    const handleMinimize = () => {
        window.electron.minimize();
    };

    const handleMaximize = () => {
        window.electron.maximize();
        setIsMaximized(!isMaximized);
    };

    const handleClose = () => {
        window.electron.close();
    };

    return (
        <div id="window">
            <div id="titleleft">
                <div id="windowlogo">××</div><div id="windowtitle">deadforge</div><div id="onlinestatus" className="material-symbols"><div id="updatestatus" className="material-symbols" status="appnotloaded"></div></div>
            </div>
            <div id="controls">
                <div id="minimize" className="material-symbols" onClick={handleMinimize}>horizontal_rule</div>
                <div id="maximize" className="material-symbols" onClick={handleMaximize}>square</div>
                <div id="close" className="material-symbols" onClick={handleClose}>close</div>
            </div>
        </div>
    )
}
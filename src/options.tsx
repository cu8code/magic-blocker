import "~style.css";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type InputHTMLAttributes } from "react"
import type { MetaData } from "~lib"

function Market() {
    const [links, setLinks] = useState<any[]>([])

    const fetchIndexRepo = async () => {
        const indexUrl = `https://raw.githubusercontent.com/cu8code/index-magic-block/main/index.json`
        try {
            const data: MetaData = await (await fetch(indexUrl)).json()
            return { status: "success", data }
        } catch (error) {
            return { status: "error", error }
        }
    }

    useEffect(() => {
        const f = async () => {
            const responce = await fetchIndexRepo()
            if (responce.status === "success") {
                let res = []
                const e = responce.data
                for (let i = 0; i < e.length; i++) {
                    try {
                        const current = e[i]
                        const username = current.username
                        const repository = current.repository
                        const branch = current.branch
                        const meta: MetaData = await (await fetch(`https://raw.githubusercontent.com/${username}/${repository}/${branch}/index.json`)).json()
                        res.push({
                            username,
                            repository,
                            branch,
                            meta
                        })
                    } catch { }
                }
                setLinks(res)
            }
        }
        f()
    }, [])

    return (
        <div className=" plasmo-w-full plasmo-space-y-10 ">
            <div className="plasmo-text-xl">Market</div>
            {
                links.map((v, i) => {
                    return (<div key={i} className="plasmo-flex-col plasmo-shadow-md plasmo-pt-10 plasmo-p-5 plasmo-bg-slate-100 plasmo-rounded-2xl">
                        <div className="plasmo-text-nowrap plasmo-text-2xl">
                            <a href={`https://github.com/${v.username}/${v.repository}`}>{v.username}/{v.repository}/{v.branch}</a>
                        </div>
                        <div>{v.meta.description}</div>
                        <div className="plasmo-flex plasmo-flex-row">
                            <div className="plasmo-basis-1/2"></div>
                            <div className="plasmo-basis-1/2 plasmo-flex plasmo-gap-5 plasmo-items-end plasmo-justify-end">
                                <div className={`plasmo-h-10 plasmo-w-16 plasmo-bg-green-500 plasmo-cursor-pointer
                                        plasmo-grid plasmo-place-items-center plasmo-text-white plasmo-font-semibold plasmo-rounded-2xl plasmo-shadow-md`}
                                    onClick={async () => {
                                        const res = await chrome.runtime.sendMessage({
                                            action: "datasetmanager.addDataset",
                                            payload: {
                                                username: v.username,
                                                repository: v.repository,
                                                branch: v.branch,
                                                meta: v.meta
                                            }
                                        })
                                        alert(res.status)
                                        console.log(res.status);

                                    }}
                                >
                                    install
                                </div>
                                <div className={`plasmo-h-10 plasmo-w-16 plasmo-bg-red-500 plasmo-cursor-pointer
                                        plasmo-grid plasmo-place-items-center plasmo-text-white plasmo-font-semibold plasmo-rounded-2xl plasmo-shadow-md`}
                                    onClick={async () => {
                                        const res = await chrome.runtime.sendMessage({
                                            action: "datasetmanager.removeDataset",
                                            payload: {
                                                username: v.username,
                                                repository: v.repository,
                                                branch: v.branch,
                                                meta: v.meta
                                            }
                                        })
                                        alert(res.status)
                                        console.log(res.status);
                                    }}
                                >
                                    remove
                                </div>
                            </div>
                        </div>
                    </div>)
                })
            }
        </div>
    )
}



function TimeSlider() {
    const [time, setTime] = useState("0");
    const sliderRef = useRef(null);

    useEffect(() => {
        const f = async () => {
            if (sliderRef.current) {
                const t = await chrome.runtime.sendMessage({
                    action: "sessionManager.getSessionTime"
                })
                console.log(t);
                const r = String(Math.floor(t.result / 60000))

                sliderRef.current.value = r;
                setTime(r)
            }
        }
        f()
    }, [sliderRef]);

    const handleChange = (e) => {
        setTime(e.target.value);
        chrome.runtime.sendMessage({
            action: "sessionManager.updateSessionTime",
            sessionTime: Math.floor(Number(e.target.value))
        });
    };

    return (
        <div className="plasmo-flex plasmo-w-full plasmo-gap-5">
            <input
                className="plasmo-basis-2/3 plasmo-w-full"
                type="range"
                ref={sliderRef}
                name="time"
                value={time}
                onChange={handleChange}
            />
            <div className="plasmo-text-end">{time}</div>
        </div>
    );
}

function InstalledData() {
    const [data, setData] = useState([]);
    useEffect(() => {
        chrome.runtime.sendMessage({action:"datasetmanager.listDatasets"}, (e) => {
            console.log(e);
            
            setData(e.result)
        })
    }, [])
    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-w-full">
            <div className="plasmo-text-xl">Installed Dataset</div>
            <div className="plasmo-flex plasmo-flex-col plasmo-space-y-5 plasmo-pt-5">
                {data.map((v) => {
                    return (
                        <div className="plasmo-h-32 plasmo-bg-gray-100 plasmo-rounded-2xl plasmo-shadow-md plasmo-p-4">
                            <a className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-700" href={`https://raw.githubusercontent.com/${v.username}/${v.repository}/${v.branch}`}>{v.username}/{v.repository}/{v.branch}</a>
                            <div className="plasmo-flex plasmo-w-full plasmo-h-full plasmo-items-end">
                                <button className="plasmo-bg-red-500 plasmo-h-10 plasmo-w-20 plasmo-rounded-3xl plasmo-text-white plasmo-font-semibold plasmo-cursor-pointer">remove</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function Options() {
    return (
        <div className="plasmo-w-full plasmo-space-y-5">
            <div className="plasmo-text-xl">Options</div>
            <div className="plasmo-flex plasmo-flex-col">
                <div className="plasmo-flex plasmo-text-lg plasmo-gap-4 plasmo-w-full">
                    <div className="plasmo-basis-1/3">Interval</div>
                    <TimeSlider />
                </div>
            </div>
            <InstalledData />
        </div>
    )
}

function Button(props: ComponentPropsWithoutRef<"button"> & { text: string }) {
    return (
        <button {...props} className="plasmo-bg-slate-300 plasmo-h-10 plasmo-w-20 plasmo-rounded-3xl">
            {props.text}
        </button>
    )
}

export default function Main() {
    const [market, setMarket] = useState(false)
    return (
        <div className="plasmo-m-auto plasmo-max-w-4xl plasmo-space-y-14">
            <div className="plasmo-flex plasmo-flex-row plasmo-justify-center m-auto plasmo-pt-2 plasmo-gap-4">
                <Button text="Options" onClick={() => setMarket(false)} />
                <Button text="Market" onClick={() => setMarket(true)} />
            </div>
            {market ? <Market /> : <Options />}
        </div>
    )
}
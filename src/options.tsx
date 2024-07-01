import "~style.css";

import { useEffect, useState } from "react"
import type { MetaData } from "~lib"

export default function Options() {
    const [links, setLinks] = useState<any[]>([])
    const [market, setMarket] = useState(false)

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
        <div className="plasmo-m-auto plasmo-max-w-4xl plasmo-space-y-14">
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
        </div>
    )
}
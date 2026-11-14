import { useState } from 'react'
import PictureWindow from "../components/PictureWindow.jsx";
import {Action} from "../components/Action.jsx";
import {Navigation} from "lucide-react"
import {CoordinateInput} from "../components/CoordinateInput.jsx";

function Home() {
    return (
        <div className="flex flex-col items-start gap-4 p-6">
            <PictureWindow />

        </div>
    )
}

export default Home
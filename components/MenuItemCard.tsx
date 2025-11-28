import React from "react"
import { MenuItemCardProps } from "@/types"

export default function MenuItemCard({ item }: MenuItemCardProps) {
    return (
        <div className="card bg-base-100 w-96 shadow-sm">
            <figure>
                <img
                src="{item.image_url}"
                alt="item.name" />
            </figure>
            <div className="card-body">
                <h2 className="card-title">{item.name}</h2>
                <p>{item.description}</p>
                <div className="card-actions justify-end">
                <button className="btn btn-primary">Add to Cart</button>
                </div>
            </div>
        </div>
    )
}
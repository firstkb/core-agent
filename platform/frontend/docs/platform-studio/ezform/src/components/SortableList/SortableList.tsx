import React from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { Field } from '../../context/FormContext';

interface SortableListProps<T> {
    items: Field[];
    renderItem: (item: Field, index: number) => React.ReactElement;
    onMove: (fromIndex: number, toIndex: number) => void;
}

function SortableList<T>({ items, renderItem, onMove }: SortableListProps<T>) {
    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            onMove(oldIndex, newIndex);
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => (
                    <SortableItem key={item.id} id={item.id}>
                        {renderItem(item, index)}
                    </SortableItem>
                ))}
            </SortableContext>
        </DndContext>
    );
}

export default SortableList;
package com.mobi.semantic.translator.stack;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.semantic.translator.SemanticTranslator;

import java.util.Optional;

/**
 * This extension to the {@link SemanticTranslator} interface will leverage the tree-like structure of the content
 * using an internal {@link java.util.Deque} to more easily translate hierarchical structures with shared abstracted
 * modules.
 *
 * @param <T> The {@link StackItem} for the particular implementation being used.  This item will contain logic suited
 *            for your specific implementation.
 */
public interface StackingSemanticTranslator<T extends StackItem> extends SemanticTranslator {

    /**
     * Push an {@link StackItem} of your implementation onto the LIFO stack.
     *
     * @param item The {@link StackItem} to push
     * @return The {@link StackItem} you pushed, in order to support method chaining
     */
    T pushStack(T item);

    /**
     * Pop the last item pushed to the stack off.
     *
     * @return An {@link Optional} containing a {@link StackItem} if the stack isn't empty
     */
    Optional<T> popStack();

    /**
     * Peek at the last item pushed to the stack.
     *
     * @return An {@link Optional} containing a {@link StackItem} if the stack isn't empty
     */
    Optional<T> peekStack();

    /**
     * Get a string representation of the items on the stack, which more or less represents an address of the data
     * currently being processed.
     *
     * @return A string representation of the current stack items
     */
    String getCurrentLocation();

}

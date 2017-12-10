package com.mobi.meaning.extraction.json;

        /*-
         * #%L
         * meaning.extraction.json
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

import com.mobi.meaning.extraction.stack.AbstractStackItem;
import com.mobi.meaning.extraction.stack.StackItem;
import com.mobi.rdf.api.IRI;

public class JsonStackItem extends AbstractStackItem implements StackItem {

    boolean array = false;

    public JsonStackItem(String id, boolean root) {
        super(id, root);
    }

    public boolean isArray() {
        return array;
    }

    public void setArray(boolean array) {
        this.array = array;
    }
}

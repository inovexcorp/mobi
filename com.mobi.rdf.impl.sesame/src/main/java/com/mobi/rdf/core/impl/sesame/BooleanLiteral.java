package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.openrdf.model.vocabulary.XMLSchema;

public class BooleanLiteral extends SimpleLiteral {

    private static final long serialVersionUID = -3841745456269043030L;

    private boolean value;

    public static final BooleanLiteral TRUE = new BooleanLiteral(true);
    public static final BooleanLiteral FALSE = new BooleanLiteral(false);

    /**
     * Creates an xsd:boolean typed literal with the specified value.
     */
    protected BooleanLiteral(boolean value) {
        super(Boolean.toString(value), new SimpleIRI(XMLSchema.BOOLEAN.stringValue()));
        this.value = value;
    }

    @Override
    public boolean booleanValue() {
        return value;
    }

    /**
     * Returns a {@link BooleanLiteral} for the specified value. This method
     * uses the constants {@link #TRUE} and {@link #FALSE} as result values,
     * preventing the often unnecessary creation of new {@link BooleanLiteral} objects.
     */
    public static BooleanLiteral valueOf(boolean value) {
        return value ? TRUE : FALSE;
    }

}

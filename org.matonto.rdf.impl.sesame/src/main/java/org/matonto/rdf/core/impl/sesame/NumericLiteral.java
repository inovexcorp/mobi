package org.matonto.rdf.core.impl.sesame;

/*-
 * #%L
 * org.matonto.rdf.impl.sesame
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

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.model.vocabulary.XMLSchema;

public class NumericLiteral extends SimpleLiteral {

    private static final long serialVersionUID = 7927800894389563875L;

    private final Number number;

    private static final ValueFactory MATONTO_VF = SimpleValueFactory.getInstance();

    /**
     * Creates a literal with the specified value and datatype.
     */
    protected NumericLiteral(Number number, IRI datatype) {
        super(number.toString(), datatype);
        this.number = number;
    }

    /**
     * Creates an xsd:byte typed litral with the specified value.
     */
    protected NumericLiteral(byte number) {
        this(number, MATONTO_VF.createIRI(XMLSchema.BYTE.stringValue()));
    }

    /**
     * Creates an xsd:short typed litral with the specified value.
     */
    protected NumericLiteral(short number) {
        this(number, MATONTO_VF.createIRI(XMLSchema.SHORT.stringValue()));
    }

    /**
     * Creates an xsd:int typed litral with the specified value.
     */
    protected NumericLiteral(int number) {
        this(number, MATONTO_VF.createIRI(XMLSchema.INT.stringValue()));
    }

    /**
     * Creates an xsd:long typed litral with the specified value.
     */
    protected NumericLiteral(long n) {
        this(n, MATONTO_VF.createIRI(XMLSchema.LONG.stringValue()));
    }

    /**
     * Creates an xsd:float typed litral with the specified value.
     */
    protected NumericLiteral(float n) {
        this(n, MATONTO_VF.createIRI(XMLSchema.FLOAT.stringValue()));
    }

    /**
     * Creates an xsd:double typed litral with the specified value.
     */
    protected NumericLiteral(double n) {
        this(n, MATONTO_VF.createIRI(XMLSchema.DOUBLE.stringValue()));
    }

    @Override
    public byte byteValue()
    {
        return number.byteValue();
    }

    @Override
    public short shortValue()
    {
        return number.shortValue();
    }

    @Override
    public int intValue()
    {
        return number.intValue();
    }

    @Override
    public long longValue()
    {
        return number.longValue();
    }

    @Override
    public float floatValue()
    {
        return number.floatValue();
    }

    @Override
    public double doubleValue()
    {
        return number.doubleValue();
    }
}

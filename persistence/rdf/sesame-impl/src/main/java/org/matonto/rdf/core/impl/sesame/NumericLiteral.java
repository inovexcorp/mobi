package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.core.api.IRI;
import org.matonto.rdf.core.api.ValueFactory;
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

package org.matonto.rdf.core.impl.sesame;

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

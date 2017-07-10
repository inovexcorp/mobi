package org.matonto.rdf.orm.conversion.impl;

import aQute.bnd.annotation.component.Component;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

@Component(provide = ValueConverter.class)
public class BooleanValueConverter extends AbstractValueConverter<Boolean> {

    public BooleanValueConverter() {
        super(Boolean.class);
    }

    @Override
    public Boolean convertValue(final Value value, final Thing thing, final Class<? extends Boolean> desiredType) throws ValueConversionException {
        try {
            return ((Literal) value).booleanValue();
        } catch (Exception e) {
            throw new ValueConversionException("Issue converting '" + value.stringValue() + "' to boolean", e);
        }
    }

    @Override
    public Value convertType(final Boolean value, final Thing thing) throws ValueConversionException {
        return this.valueFactory.createLiteral(value);
    }
}

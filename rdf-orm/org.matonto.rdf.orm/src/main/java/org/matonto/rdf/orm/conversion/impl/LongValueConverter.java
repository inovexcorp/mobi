package org.matonto.rdf.orm.conversion.impl;

import aQute.bnd.annotation.component.Component;
import org.matonto.rdf.api.Literal;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.AbstractValueConverter;
import org.matonto.rdf.orm.conversion.ValueConversionException;
import org.matonto.rdf.orm.conversion.ValueConverter;

import javax.annotation.Nonnull;

@Component(provide = ValueConverter.class)
public class LongValueConverter extends AbstractValueConverter<Long> {

    public LongValueConverter() {
        super(Long.class);
    }

    @Override
    public Long convertValue(@Nonnull Value value, Thing thing, @Nonnull Class<? extends Long> desiredType) throws ValueConversionException {
        try {
            return ((Literal) value).longValue();
        } catch (Exception e) {
            throw new ValueConversionException("Issue convertinthg value to long", e);
        }
    }

    @Override
    public Value convertType(@Nonnull Long type, Thing thing) throws ValueConversionException {
        return getValueFactory(thing).createLiteral(type);
    }
}

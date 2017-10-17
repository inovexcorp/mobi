package com.mobi.etl.service.delimited;

/*-
 * #%L
 * com.mobi.etl.delimited
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

import com.mobi.etl.api.delimited.MappingId;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.ontologies.delimited.ClassMapping;
import com.mobi.etl.api.ontologies.delimited.Mapping;
import com.mobi.rdf.api.Model;

import javax.annotation.Nonnull;
import java.util.Collection;

public class SimpleMappingWrapper implements MappingWrapper {

    private MappingId mappingId;
    private Mapping mapping;
    private Collection<ClassMapping> classMappings;
    private Model model;

    public SimpleMappingWrapper(@Nonnull MappingId mappingId, @Nonnull Mapping mapping,
                                @Nonnull Collection<ClassMapping> classMappings, @Nonnull Model model) {
        this.mappingId = mappingId;
        this.mapping = mapping;
        this.classMappings = classMappings;
        this.model = model;
    }

    @Override
    public MappingId getId() {
        return mappingId;
    }

    @Override
    public Mapping getMapping() {
        return mapping;
    }

    @Override
    public Collection<ClassMapping> getClassMappings() {
        return classMappings;
    }

    @Override
    public Model getModel() {
        return model;
    }
}

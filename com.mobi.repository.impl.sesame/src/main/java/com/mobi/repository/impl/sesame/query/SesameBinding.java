package com.mobi.repository.impl.sesame.query;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
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

import com.mobi.query.api.Binding;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.core.utils.Values;

public class SesameBinding implements Binding {

    private org.openrdf.query.Binding binding;

    public SesameBinding(org.openrdf.query.Binding binding) {
        this.binding = binding;
    }

    @Override
    public String getName() {
        return binding.getName();
    }

    @Override
    public Value getValue() {
        return Values.matontoValue(binding.getValue());
    }

}

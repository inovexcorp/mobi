package com.mobi.meaning.extraction.stack;

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

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class AbstractStackingMeaningExtractorTest {

    private StackingMeaningExtractor<ExampleStackItem> testing;

    @Before
    public void initExtractor() {
        this.testing = new ExampleStackingMeaningExtractor();
    }

    @Test
    public void testCurrentLocation() {
        Assert.assertNotNull(testing.getCurrentLocation());
        testing.pushStack(new ExampleStackItem("root"));
        Assert.assertEquals("{root}", testing.getCurrentLocation());
        testing.pushStack(new ExampleStackItem("first"));
        Assert.assertEquals("{root|first}", testing.getCurrentLocation());
        testing.pushStack(new ExampleStackItem("second"));
        Assert.assertEquals("{root|first|second}", testing.getCurrentLocation());
        Assert.assertEquals("second", testing.popStack().getIdentifier());
        Assert.assertEquals("{root|first}", testing.getCurrentLocation());
    }


}

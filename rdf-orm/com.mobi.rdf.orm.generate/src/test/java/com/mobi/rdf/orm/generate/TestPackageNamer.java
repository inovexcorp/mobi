package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * rdf.orm.generate
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class TestPackageNamer {

    private static final String extendedDocumentMetadata = "http://cambridgesemantics.com/ontologies/2012/07/ExtendedDocumentMetadata";
    private static final String lillyCore = "http://www.lilly.com/ontologies/2015/SDP/LillyCore";
    private static final String lillyService = "http://www.lilly.com/ontologies/2015/SDP/LillyServices";

    @Test
    public void testGood() throws Exception {
        assertEquals("com.cambridgesemantics.ontologies._2012._07.extendeddocumentmetadata",
                PackageNamer.packageFromUrl(extendedDocumentMetadata));
        assertEquals("com.lilly.www.ontologies._2015.sdp.lillycore", PackageNamer.packageFromUrl(lillyCore));
        assertEquals("com.lilly.www.ontologies._2015.sdp.lillyservices", PackageNamer.packageFromUrl(lillyService));
    }
}
